import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { invoice_id } = await req.json()

    // Get invoice with related data
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .select(`
        *,
        booking:advertising_leads(*),
        user:user_profiles(*)
      `)
      .eq('id', invoice_id)
      .single()

    if (invoiceError || !invoice) {
      throw new Error('Invoice not found')
    }

    // Generate HTML for PDF
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Helvetica', Arial, sans-serif; color: #333; padding: 40px; }
    .header { display: flex; justify-content: space-between; align-items: start; margin-bottom: 40px; }
    .logo { font-size: 32px; font-weight: bold; color: #FF6600; }
    .company-details { text-align: right; font-size: 12px; line-height: 1.6; }
    .invoice-title { font-size: 36px; color: #000; margin-bottom: 10px; }
    .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 40px; background: #f4f4f4; padding: 20px; }
    .bill-to { margin-bottom: 40px; }
    .bill-to h3 { font-size: 14px; color: #666; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { background: #000; color: white; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; }
    td { padding: 12px; border-bottom: 1px solid #ddd; }
    .totals { margin-left: auto; width: 300px; }
    .totals tr td { border: none; padding: 8px; }
    .totals tr:last-child { font-weight: bold; font-size: 18px; border-top: 2px solid #000; }
    .footer { margin-top: 60px; text-align: center; font-size: 11px; color: #666; border-top: 1px solid #ddd; padding-top: 20px; }
    .payment-terms { background: #FFF9E6; border-left: 4px solid #FF6600; padding: 20px; margin-top: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">ROCK.SCOT</div>
      <div style="color: #666; font-size: 14px; margin-top: 5px;">Scotland's Rock Station</div>
    </div>
    <div class="company-details">
      <strong>Caledonia TX Ltd</strong><br>
      Scotland, United Kingdom<br>
      Company No: SC646223<br>
      VAT No: 491589639<br>
      <br>
      Email: advertise@rock.scot<br>
      Phone: 0141 459 ROCK (7625)
    </div>
  </div>

  <div class="invoice-title">INVOICE</div>

  <div class="invoice-meta">
    <div>
      <strong>Invoice Number:</strong> ${invoice.invoice_number}<br>
      <strong>Invoice Date:</strong> ${new Date(invoice.invoice_date).toLocaleDateString('en-GB')}<br>
      <strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString('en-GB')}
    </div>
    <div style="text-align: right;">
      <strong>Status:</strong> <span style="color: ${invoice.status === 'paid' ? '#00AA00' : '#FF6600'}; text-transform: uppercase;">${invoice.status}</span>
    </div>
  </div>

  <div class="bill-to">
    <h3>BILL TO:</h3>
    <strong>${invoice.booking.company || invoice.booking.first_name + ' ' + invoice.booking.last_name}</strong><br>
    ${invoice.booking.email}<br>
    ${invoice.booking.phone || ''}
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th style="text-align: center;">Duration</th>
        <th style="text-align: right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>${invoice.booking.product_name}</strong><br>
          <span style="font-size: 12px; color: #666;">
            DAB+ Radio Advertising<br>
            134 plays over ${invoice.booking.campaign_length_days} days
          </span>
        </td>
        <td style="text-align: center;">${invoice.booking.campaign_length_days} days</td>
        <td style="text-align: right;">£${(invoice.subtotal_pence / 100).toFixed(2)}</td>
      </tr>
      ${invoice.booking.bolt_on_included ? `
      <tr>
        <td>
          <strong>Professional Advert Production</strong><br>
          <span style="font-size: 12px; color: #666;">30-second radio-ready advert with 3 redrafts</span>
        </td>
        <td style="text-align: center;">1</td>
        <td style="text-align: right;">£${(invoice.booking.bolt_on_cost_pence / 100).toFixed(2)}</td>
      </tr>
      ` : ''}
    </tbody>
  </table>

  <table class="totals">
    <tr>
      <td>Subtotal:</td>
      <td style="text-align: right;">£${(invoice.subtotal_pence / 100).toFixed(2)}</td>
    </tr>
    <tr>
      <td>VAT (20%):</td>
      <td style="text-align: right;">£${(invoice.vat_pence / 100).toFixed(2)}</td>
    </tr>
    <tr>
      <td>TOTAL:</td>
      <td style="text-align: right; color: #FF6600;">£${(invoice.total_pence / 100).toFixed(2)}</td>
    </tr>
  </table>

  <div class="payment-terms">
    <strong>Payment Terms</strong><br><br>
    Payment is due within 14 days of invoice date.<br><br>
    <strong>Bank Transfer:</strong><br>
    Account Name: Caledonia TX Ltd<br>
    Sort Code: XX-XX-XX<br>
    Account Number: XXXXXXXX<br>
    Reference: ${invoice.invoice_number}<br><br>
    <strong>Card Payment:</strong> Visit your customer portal or reply to this email for payment link.
  </div>

  <div class="footer">
    ROCK.SCOT is a trading name of Caledonia TX Ltd<br>
    Registered in Scotland No. SC646223 | VAT No. GB491589639<br>
    Ofcom Licensed Digital Sound Programme Service<br>
    <br>
    Thank you for advertising with Scotland's Rock Station! 🎸
  </div>
</body>
</html>
    `

    // Convert HTML to PDF using PDF Generator API (or similar service)
    // For now, we'll save the HTML and provide download link
    // In production, use: jsPDF, Puppeteer, or PDF Generation API

    // Upload to Supabase Storage
    const pdfFilename = `invoices/${invoice.invoice_number}.html`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(pdfFilename, html, {
        contentType: 'text/html',
        upsert: true
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(pdfFilename)

    // Update invoice with PDF URL
    await supabase
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoice_id)

    // Log activity
    await supabase.rpc('log_activity', {
      p_action: 'invoice_generated',
      p_entity_type: 'invoice',
      p_entity_id: invoice_id,
      p_description: `Invoice ${invoice.invoice_number} generated`
    })

    return new Response(
      JSON.stringify({ 
        success: true,
        pdf_url: publicUrl,
        invoice_number: invoice.invoice_number
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
