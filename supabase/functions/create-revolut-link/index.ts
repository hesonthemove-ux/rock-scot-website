// ROCK.SCOT — Revolut Payment Link Generator
// Creates a Revolut payment link and records the invoice
// Deploy: supabase functions deploy create-revolut-link

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { booking_id } = await req.json()
    if (!booking_id) throw new Error('booking_id required')

    // Get booking
    const { data: booking, error: bErr } = await supabase
      .from('advertising_leads')
      .select('*')
      .eq('id', booking_id)
      .single()
    if (bErr || !booking) throw new Error('Booking not found')

    // Calculate VAT
    const subtotal  = booking.final_price_pence || booking.product_net_pence
    const vat       = Math.round(subtotal * 0.20)
    const total     = subtotal + vat
    const dueDate   = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
                        .toISOString().split('T')[0]

    // Check if invoice already exists
    const { data: existing } = await supabase
      .from('invoices')
      .select('*')
      .eq('booking_id', booking_id)
      .single()

    let invoice = existing

    if (!invoice) {
      // Create invoice
      const { data: newInv, error: invErr } = await supabase
        .from('invoices')
        .insert([{
          booking_id:      booking.id,
          user_id:         booking.user_id,
          subtotal_pence:  subtotal,
          vat_pence:       vat,
          total_pence:     total,
          due_date:        dueDate,
          status:          'sent',
          payment_method:  'revolut',
        }])
        .select()
        .single()
      if (invErr) throw invErr
      invoice = newInv
    }

    // Create Revolut payment link via Revolut Business API
    const revolutApiKey = Deno.env.get('REVOLUT_API_KEY')
    let revolut_payment_link = null

    if (revolutApiKey) {
      const revolutBody = {
        amount:      total,        // already in pence
        currency:    'GBP',
        customer_email: booking.email,
        description: `ROCK.SCOT ${booking.product_name} — ${invoice.invoice_number}`,
        reference:   invoice.invoice_number,
        redirect_url: `https://rock.scot/payment-confirmed?inv=${invoice.id}`,
        cancel_url:   `https://rock.scot/advertise.html`,
        settlement_currency: 'GBP',
      }

      try {
        const revRes = await fetch('https://merchant.revolut.com/api/orders', {
          method:  'POST',
          headers: {
            'Authorization': `Bearer ${revolutApiKey}`,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
          },
          body: JSON.stringify(revolutBody),
        })

        if (revRes.ok) {
          const revData = await revRes.json()
          revolut_payment_link = revData.checkout_url || revData.public_id
            ? `https://checkout.revolut.com/payment-link/${revData.public_id}`
            : null
        } else {
          console.warn('Revolut API error:', await revRes.text())
          // Fall back to manual bank transfer
          revolut_payment_link = null
        }
      } catch (revolut_err) {
        console.warn('Revolut API unavailable, using manual transfer:', revolut_err.message)
      }
    }

    // If no Revolut API key or it failed — create a manual payment reference
    if (!revolut_payment_link) {
      revolut_payment_link = null // Will show bank details in email instead
    }

    // Update invoice with payment link
    await supabase
      .from('invoices')
      .update({ revolut_payment_link })
      .eq('id', invoice.id)

    // Send invoice email via Resend
    const resendKey = Deno.env.get('RESEND_API_KEY')
    if (resendKey) {
      const paymentHtml = revolut_payment_link
        ? `<a href="${revolut_payment_link}" style="background:#FF6600;color:white;padding:15px 30px;text-decoration:none;font-weight:bold;border-radius:5px;display:inline-block;">
             💳 Pay £${(total/100).toFixed(2)} via Revolut
           </a>`
        : `<div style="background:#f4f4f4;padding:20px;border-radius:5px;">
             <strong>Bank Transfer Details:</strong><br>
             Account Name: Caledonia TX Ltd<br>
             Bank: Revolut Business<br>
             Reference: <strong>${invoice.invoice_number}</strong><br>
             Amount: <strong>£${(total/100).toFixed(2)}</strong><br>
             <em>Send us your payment confirmation email once done.</em>
           </div>`

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    'ROCK.SCOT <bookings@rock.scot>',
          to:      booking.email,
          subject: `Invoice ${invoice.invoice_number} — ROCK.SCOT Advertising`,
          html: `
<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:auto;padding:20px;">
  <div style="background:#000;padding:20px;text-align:center;">
    <span style="font-size:28px;font-weight:bold;color:#FF6600;font-family:Impact,sans-serif;">ROCK.SCOT</span>
    <p style="color:#999;margin:5px 0 0;">Scotland's Rock Station</p>
  </div>
  <div style="padding:30px;">
    <h2>Hi ${booking.first_name},</h2>
    <p>Your invoice is ready. Please pay within 14 days to confirm your campaign.</p>
    <table style="width:100%;border-collapse:collapse;margin:20px 0;">
      <tr style="background:#f4f4f4;"><td style="padding:10px;"><strong>Invoice</strong></td><td style="padding:10px;">${invoice.invoice_number}</td></tr>
      <tr><td style="padding:10px;"><strong>Package</strong></td><td style="padding:10px;">${booking.product_name}</td></tr>
      <tr><td style="padding:10px;"><strong>Subtotal</strong></td><td style="padding:10px;">£${(subtotal/100).toFixed(2)}</td></tr>
      <tr><td style="padding:10px;"><strong>VAT (20%)</strong></td><td style="padding:10px;">£${(vat/100).toFixed(2)}</td></tr>
      <tr style="background:#FF6600;color:white;"><td style="padding:10px;"><strong>TOTAL DUE</strong></td><td style="padding:10px;"><strong>£${(total/100).toFixed(2)}</strong></td></tr>
    </table>
    <p style="text-align:center;margin:30px 0;">${paymentHtml}</p>
    <p style="color:#666;font-size:13px;">Due: ${dueDate} · Questions: <a href="mailto:advertise@rock.scot">advertise@rock.scot</a> · 0141 459 ROCK</p>
  </div>
  <div style="background:#000;color:#666;padding:15px;text-align:center;font-size:12px;">
    Caledonia TX Ltd · SC646223 · VAT 491589639 · Ofcom Licensed
  </div>
</body></html>`
        })
      })

      // Notify admin
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from:    'ROCK.SCOT Bookings <bookings@rock.scot>',
          to:      'advertise@rock.scot',
          subject: `🧾 Invoice sent: ${invoice.invoice_number} — £${(total/100).toFixed(2)}`,
          html:    `<p>Invoice ${invoice.invoice_number} sent to ${booking.email} for £${(total/100).toFixed(2)}.</p>
                    <p>Booking: ${booking.product_name} · ${booking.campaign_length_days} days</p>
                    ${revolut_payment_link ? `<p>Payment link: <a href="${revolut_payment_link}">${revolut_payment_link}</a></p>` : '<p>Manual bank transfer</p>'}`
        })
      })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_action:       'invoice_sent',
      p_entity_type:  'invoice',
      p_entity_id:    invoice.id,
      p_description:  `Invoice ${invoice.invoice_number} created and sent — £${(total/100).toFixed(2)}`,
    })

    return new Response(JSON.stringify({
      success:              true,
      invoice_id:           invoice.id,
      invoice_number:       invoice.invoice_number,
      total_pence:          total,
      revolut_payment_link,
      message:              revolut_payment_link
        ? 'Invoice sent with Revolut payment link'
        : 'Invoice sent with bank transfer details',
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  } catch (err) {
    console.error('create-revolut-link error:', err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
