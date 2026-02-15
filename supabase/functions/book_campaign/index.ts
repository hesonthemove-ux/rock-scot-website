import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Parse request body
    const formData = await req.json()
    console.log('📝 Received booking request:', { 
      email: formData.email, 
      package: formData.product_name 
    })

    // ==========================================
    // 1. VALIDATE DISCOUNT CODE (Server-side!)
    // ==========================================
    let discount = null
    let discountAmount = 0

    if (formData.discount_code) {
      console.log('🎫 Validating discount code:', formData.discount_code)
      
      const { data: discountData, error: discountError } = await supabase
        .rpc('validate_discount', { p_code: formData.discount_code })
      
      if (discountError) {
        console.error('❌ Discount validation error:', discountError)
        throw new Error('Failed to validate discount code')
      }

      if (discountData && discountData.length > 0 && discountData[0].is_valid) {
        discount = discountData[0]
        console.log('✅ Valid discount:', discount.code)
      } else {
        console.log('❌ Invalid discount code')
        return new Response(
          JSON.stringify({ 
            error: 'Invalid or expired discount code',
            code: 'INVALID_DISCOUNT'
          }), 
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    }

    // ==========================================
    // 2. CALCULATE FINAL PRICE
    // ==========================================
    let finalPrice = formData.product_net_pence

    if (discount) {
      if (discount.amount_pence) {
        // Fixed amount discount
        discountAmount = discount.amount_pence
        finalPrice = Math.max(0, finalPrice - discountAmount)
        console.log(`💰 Applied £${(discountAmount / 100).toFixed(2)} discount`)
      } else if (discount.percent_off) {
        // Percentage discount
        discountAmount = Math.round(finalPrice * (discount.percent_off / 100))
        finalPrice = finalPrice - discountAmount
        console.log(`💰 Applied ${discount.percent_off}% discount`)
      }
    }

    // Add rush surcharge if applicable
    if (formData.is_rush) {
      finalPrice += 5000 // £50 rush fee
      console.log('⚡ Rush surcharge applied: +£50')
    }

    // ==========================================
    // 3. CHECK FOR DUPLICATE SUBMISSIONS
    // ==========================================
    const { data: existingBooking } = await supabase
      .from('advertising_leads')
      .select('id, created_at')
      .eq('email', formData.email)
      .eq('product_id', formData.product_id)
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Last 5 mins
      .single()

    if (existingBooking) {
      console.log('⚠️  Duplicate submission detected')
      return new Response(
        JSON.stringify({ 
          error: 'Duplicate submission detected. Please wait 5 minutes before resubmitting.',
          code: 'DUPLICATE_SUBMISSION'
        }), 
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // ==========================================
    // 4. INSERT BOOKING TO DATABASE
    // ==========================================
    const bookingData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      company: formData.company || null,
      email: formData.email,
      phone: formData.phone || null,

      product_id: formData.product_id,
      product_name: formData.product_name,
      campaign_length_days: formData.campaign_length_days,

      mux_type: formData.mux_type || 'multi',
      selected_mux: formData.selected_mux || null,
      mux_weight: formData.mux_weight ?? 3,

      product_net_pence: formData.product_net_pence,
      bolt_on_included: formData.bolt_on_included || false,
      bolt_on_cost_pence: formData.bolt_on_cost_pence || 0,

      discount_code: discount?.code || null,
      message: formData.message || null,

      start_date: formData.start_date || null,
      is_rush: formData.is_rush || false,

      // Server-calculated fields (client can't fake these!)
      final_price_pence: finalPrice,
      discount_amount_pence: discountAmount,

      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      submitted_via: formData.submitted_via || 'edge_function',

      meta: {
        discount_applied: discount ? {
          code: discount.code,
          type: discount.amount_pence ? 'fixed' : 'percent',
          value: discount.amount_pence || discount.percent_off
        } : null,
        submitted_via: 'edge_function',
        timestamp: new Date().toISOString()
      }
    }

    const { data: booking, error: bookingError } = await supabase
      .from('advertising_leads')
      .insert([bookingData])
      .select()
      .single()

    if (bookingError) {
      console.error('❌ Database insert error:', bookingError)
      throw new Error(`Failed to create booking: ${bookingError.message}`)
    }

    console.log('✅ Booking created:', booking.id)

    // ==========================================
    // 5. SEND CONFIRMATION EMAILS
    // ==========================================
    
    // Email to customer
    const customerEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .header { background: #FF6600; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .details { background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0; }
    .footer { background: #000; color: white; padding: 20px; text-align: center; font-size: 12px; }
    .price { font-size: 24px; font-weight: bold; color: #FF6600; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎸 ROCK.SCOT</h1>
    <h2>Booking Confirmed!</h2>
  </div>
  <div class="content">
    <p>Hi ${formData.first_name},</p>
    
    <p><strong>Thanks for booking with Scotland's Rock Station!</strong></p>
    
    <p>Your advertising campaign is confirmed and we're excited to get your message out to our rock audience.</p>
    
    <div class="details">
      <h3>Campaign Details:</h3>
      <ul>
        <li><strong>Package:</strong> ${formData.product_name}</li>
        <li><strong>Duration:</strong> ${formData.campaign_length_days} days</li>
        <li><strong>Price:</strong> <span class="price">£${(finalPrice / 100).toFixed(2)}</span> ${discount ? `(${discount.code} discount applied)` : ''}</li>
        ${formData.start_date ? `<li><strong>Start Date:</strong> ${formData.start_date}</li>` : ''}
      </ul>
    </div>
    
    <p><strong>What happens next?</strong></p>
    <ol>
      <li>We'll review your booking within 24 hours</li>
      <li>Send you an invoice via email</li>
      <li>Once payment is received, your campaign goes live!</li>
    </ol>
    
    <p>Questions? Reply to this email or call us at <strong>0141 459 ROCK (7625)</strong></p>
    
    <p>Rock on! 🤘<br>
    The ROCK.SCOT Team</p>
  </div>
  <div class="footer">
    <p>ROCK.SCOT | Scotland's Rock Station</p>
    <p>Caledonia TX Ltd | SC646223 | Ofcom Licensed</p>
    <p>studio@rock.scot | 0141 459 ROCK</p>
  </div>
</body>
</html>
    `

    // Email to admin
    const adminEmailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: monospace; font-size: 14px; }
    .alert { background: #FFD700; padding: 10px; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; margin: 10px 0; }
    td { padding: 8px; border: 1px solid #ddd; }
    td:first-child { font-weight: bold; width: 200px; background: #f4f4f4; }
  </style>
</head>
<body>
  <div class="alert">🚨 NEW ADVERTISING BOOKING RECEIVED</div>
  
  <h2>Customer Details</h2>
  <table>
    <tr><td>Name</td><td>${formData.first_name} ${formData.last_name}</td></tr>
    <tr><td>Company</td><td>${formData.company || 'N/A'}</td></tr>
    <tr><td>Email</td><td><a href="mailto:${formData.email}">${formData.email}</a></td></tr>
    <tr><td>Phone</td><td>${formData.phone || 'N/A'}</td></tr>
  </table>
  
  <h2>Campaign Details</h2>
  <table>
    <tr><td>Package</td><td>${formData.product_name}</td></tr>
    <tr><td>Duration</td><td>${formData.campaign_length_days} days</td></tr>
    <tr><td>Start Date</td><td>${formData.start_date || 'TBD'}</td></tr>
    <tr><td>Original Price</td><td>£${(formData.product_net_pence / 100).toFixed(2)}</td></tr>
    ${discount ? `<tr><td>Discount Applied</td><td>${discount.code} (-£${(discountAmount / 100).toFixed(2)})</td></tr>` : ''}
    <tr><td><strong>FINAL PRICE</strong></td><td><strong>£${(finalPrice / 100).toFixed(2)}</strong></td></tr>
  </table>
  
  ${formData.message ? `
  <h2>Message from Customer</h2>
  <p style="background:#f4f4f4; padding:15px; border-left:4px solid #FF6600;">
    ${formData.message}
  </p>
  ` : ''}
  
  <h2>Actions</h2>
  <p>
    1. Review campaign details<br>
    2. Generate and send invoice<br>
    3. Add to broadcast schedule once payment received
  </p>
  
  <p style="color:#666; font-size:12px;">
    Booking ID: ${booking.id}<br>
    Submitted: ${new Date().toISOString()}<br>
    IP: ${bookingData.ip_address}
  </p>
</body>
</html>
    `

    // Send emails using Resend (you'll need to add RESEND_API_KEY as environment variable)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      try {
        // Customer confirmation
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'ROCK.SCOT <bookings@rock.scot>',
            to: formData.email,
            subject: 'Booking Confirmed - ROCK.SCOT Advertising',
            html: customerEmailHtml
          })
        })
        
        // Admin notification
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'ROCK.SCOT Bookings <bookings@rock.scot>',
            to: 'advertise@rock.scot',
            subject: `🚨 NEW BOOKING: ${formData.product_name} - ${formData.first_name} ${formData.last_name}`,
            html: adminEmailHtml
          })
        })
        
        console.log('📧 Confirmation emails sent')
      } catch (emailError) {
        console.error('⚠️  Email send failed (booking still created):', emailError)
        // Don't fail the whole request if email fails
      }
    } else {
      console.log('⚠️  RESEND_API_KEY not set, emails not sent')
    }

    // ==========================================
    // 6. RETURN SUCCESS RESPONSE
    // ==========================================
    return new Response(
      JSON.stringify({ 
        success: true,
        booking_id: booking.id,
        final_price: finalPrice,
        discount_applied: discount?.code || null,
        message: 'Booking confirmed! Check your email for details.'
      }), 
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Edge Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unexpected error occurred',
        code: 'SERVER_ERROR'
      }), 
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
