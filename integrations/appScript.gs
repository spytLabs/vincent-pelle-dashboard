function doPost(e) {

var data = JSON.parse(e.postData.contents);

var ss = SpreadsheetApp.openById("1bjlF7TI7izjeY8-qKuXrfrCQZaDAW0wMWbv9rkPrtF0");
var ordersSheet = ss.getSheetByName("Orders");

var orderId = data.id;

var lastRow = ordersSheet.getLastRow();
if (lastRow > 1) {
var existingIds = ordersSheet.getRange(2, 1, lastRow - 1, 1).getValues();

  for (var i = 0; i < existingIds.length; i++) {
    if (existingIds[i][0] == orderId) {
      return ContentService.createTextOutput("Duplicate order ignored");
    }
  }

}

// Create items summary
var itemsSummary = data.line_items.map(function(item) {
return item.name + " (Qty: " + item.quantity + ")";
}).join(" | ");

// Extract meta data
var metaData = {};
data.meta_data.forEach(function(meta) {
metaData[meta.key] = meta.value;
});

var whatsappNumber = metaData["whatsapp_number"] || "";
var district = metaData["district"] || "N/A";

// Insert row
ordersSheet.appendRow([
data.id,
data.number,
data.status,
data.date_created,
data.billing.first_name + " " + data.billing.last_name,
data.billing.email,
data.billing.phone,
whatsappNumber,
data.shipping.address_1,
data.billing.address_2,
data.shipping.city,
data.shipping.state,
data.shipping.postcode,
district,
itemsSummary,
data.shipping_total,
data.total,
data.customer_note,
data.payment_method_title
]);

// Send notification email
try {
  sendOrderEmail(data, district);
} catch (err) {
  Logger.log("Email sending failed: " + err.message);
}

return ContentService.createTextOutput("Order added");
}

// ─── EMAIL CONFIG ───
var NOTIFICATION_EMAIL = "your-email@example.com"; // ← Change this to your email

function sendOrderEmail(data, district) {
  var customerName = data.billing.first_name + " " + data.billing.last_name;
  var orderDate = formatOrderDate(data.date_created);
  var htmlBody = buildEmailHtml(data, customerName, orderDate, district);

  MailApp.sendEmail({
    to: NOTIFICATION_EMAIL,
    subject: "🔔 New Order #" + data.number + " from " + customerName,
    htmlBody: htmlBody,
  });
}

function formatOrderDate(isoDate) {
  var d = new Date(isoDate);
  var days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var dayName = days[d.getDay()];
  var day = d.getDate();
  var month = months[d.getMonth()];
  var year = d.getFullYear();
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  var minStr = minutes < 10 ? "0" + minutes : minutes;
  return {
    dateLine: dayName + ", " + day + " " + month + " " + year,
    timeLine: "at " + hours + ":" + minStr + " " + ampm
  };
}

function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

function buildItemRowsHtml(lineItems) {
  return lineItems.map(function(item) {
    var variant = "";
    if (item.meta_data && item.meta_data.length > 0) {
      var attrs = item.meta_data.filter(function(m) { return m.display_key; }).map(function(m) {
        return m.display_value || m.value;
      });
      if (attrs.length > 0) variant = attrs.join(" · ");
    }
    var price = parseFloat(item.total || 0).toFixed(2);
    return '<tr>' +
      '<td>' +
        '<div class="item-product">' +
          '<div>' +
            '<div class="item-name">' + escapeHtml(item.name) + '</div>' +
            (variant ? '<div class="item-variant">' + escapeHtml(variant) + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</td>' +
      '<td class="item-qty"><span class="qty-badge">×' + item.quantity + '</span></td>' +
      '<td class="item-price">Rs. ' + price + '</td>' +
    '</tr>';
  }).join("");
}

function getStatusPillHtml(status) {
  var label = status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ") : "Pending";
  return '<div class="status-pill"><span class="status-dot"></span>' + escapeHtml(label) + '</div>';
}

function getPaymentTagHtml(paymentMethod, status) {
  var isPaid = status === "processing" || status === "completed";
  if (isPaid) {
    return '<span class="highlight-tag" style="background:#F0FFF6; border-color:#6FCF97; color:#1A6A3A;">✓ Paid</span>';
  }
  return '<span class="highlight-tag">Awaiting Payment</span>';
}

function buildEmailHtml(data, customerName, orderDate, district) {
  var subtotal = 0;
  data.line_items.forEach(function(item) { subtotal += parseFloat(item.total || 0); });
  var shippingTotal = parseFloat(data.shipping_total || 0);
  var discountTotal = parseFloat(data.discount_total || 0);
  var grandTotal = parseFloat(data.total || 0);

  var shipping = data.shipping || data.billing || {};
  var addressLine1 = escapeHtml(shipping.address_1 || "");
  var city = escapeHtml(shipping.city || "");
  var stateStr = escapeHtml(shipping.state || "");
  var postcode = escapeHtml(shipping.postcode || "");
  var country = escapeHtml(shipping.country || "");
  var addressBlock = escapeHtml(customerName) + "<br/>" +
    (addressLine1 ? addressLine1 + "<br/>" : "") +
    (city ? city + (stateStr ? ", " + stateStr : "") + (postcode ? " " + postcode : "") + "<br/>" : "") +
    (country ? country : "");

  var couponLines = "";
  if (data.coupon_lines && data.coupon_lines.length > 0) {
    data.coupon_lines.forEach(function(c) {
      var code = c.code ? c.code.toUpperCase() : "COUPON";
      var amt = parseFloat(c.discount || 0).toFixed(2);
      couponLines += '<div class="totals-row"><span>Discount (' + escapeHtml(code) + ')</span><span style="color:#1A8A52;">−Rs. ' + amt + '</span></div>';
    });
  } else if (discountTotal > 0) {
    couponLines = '<div class="totals-row"><span>Discount</span><span style="color:#1A8A52;">−Rs. ' + discountTotal.toFixed(2) + '</span></div>';
  }

  var customerNote = data.customer_note || "";
  var notesBlock = "";
  if (customerNote) {
    notesBlock = '<div class="notes-block">' +
      '<div class="notes-label">📝 Customer Note</div>' +
      '<p>"' + escapeHtml(customerNote) + '"</p>' +
    '</div>';
  }

  var html = '<!DOCTYPE html><html lang="en" xmlns="http://www.w3.org/1999/xhtml"><head>' +
    '<meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" />' +
    '<title>New Order Received</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />' +
    '<link href="https://fonts.googleapis.com/css2?family=Fragment+Mono:ital@0;1&display=swap" rel="stylesheet">' +
    '<style>' +
      '* { margin: 0; padding: 0; box-sizing: border-box; }' +
      'body { background-color: #F5F0E8; font-family: "DM Sans", Arial, sans-serif; -webkit-font-smoothing: antialiased; }' +
      '.email-wrapper { background-color: #F5F0E8; padding: 48px 20px; }' +
      '.email-container { max-width: 620px; margin: 0 auto; }' +
      '.header { background-color: #191100; border-radius: 16px 16px 0 0; padding: 36px 48px 32px; text-align: center; position: relative; overflow: hidden; }' +
      '.header::before { content: ""; position: absolute; top: -60px; left: -60px; width: 200px; height: 200px; background: radial-gradient(circle, rgba(146,146,146,0.18) 0%, transparent 70%); border-radius: 50%; }' +
      '.header::after { content: ""; position: absolute; bottom: -40px; right: -40px; width: 160px; height: 160px; background: radial-gradient(circle, rgba(138,138,138,0.12) 0%, transparent 70%); border-radius: 50%; }' +
      '.brand-logo { display: inline-flex; align-items: center; gap: 10px; margin-bottom: 20px; }' +
      '.brand-name { font-family: "Fragment Mono", sans-serif; color: #F5F0E8; font-size: 20px; font-weight: 700; letter-spacing: 0.03em; }' +
      '.new-order-badge { display: inline-block; background: linear-gradient(135deg, #f3e8d3, #d9d4cb); color: #1A1208; font-size: 10px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; padding: 5px 14px; border-radius: 20px; margin-bottom: 16px; }' +
      '.header h1 { font-family: "DM Serif Display", Georgia, serif; font-size: 36px; color: #F5F0E8; line-height: 1.15; font-style: italic; margin-bottom: 8px; }' +
      '.header-subtitle { color: rgba(245,240,232,0.55); font-size: 14px; font-weight: 300; letter-spacing: 0.04em; }' +
      '.body { background-color: #FFFFFF; padding: 44px 48px; }' +
      '.order-meta { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; padding-bottom: 28px; border-bottom: 1px solid #EDE8DF; gap: 16px; flex-wrap: wrap; }' +
      '.order-id-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9E8F77; margin-bottom: 4px; }' +
      '.order-id-value { font-family: "DM Serif Display", Georgia, serif; font-size: 28px; color: #1A1208; letter-spacing: 0.01em; }' +
      '.order-timestamp .ts-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9E8F77; margin-bottom: 4px; }' +
      '.order-timestamp .ts-value { font-size: 14px; color: #3D2F1A; font-weight: 400; }' +
      '.order-timestamp { text-align: right; }' +
      '.status-pill { display: inline-flex; align-items: center; gap: 6px; background-color: #FFF5E0; border: 1px solid #F0C96A; color: #8A5E0A; font-size: 12px; font-weight: 600; padding: 5px 12px; border-radius: 20px; margin-top: 6px; letter-spacing: 0.04em; }' +
      '.status-dot { width: 7px; height: 7px; background-color: #D4A34C; border-radius: 50%; }' +
      '.section-title { font-size: 10.5px; font-weight: 600; letter-spacing: 0.18em; text-transform: uppercase; color: #9E8F77; margin-bottom: 16px; }' +
      '.customer-card { background: #FAF7F2; border: 1px solid #EDE8DF; border-radius: 12px; padding: 20px 24px; margin-bottom: 28px; display: flex; align-items: center; gap: 16px; }' +
      '.customer-name { font-size: 16px; font-weight: 600; color: #1A1208; margin-bottom: 2px; }' +
      '.customer-details { font-size: 13px; color: #7A6A54; line-height: 1.6; }' +
      '.items-table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }' +
      '.items-table thead th { font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #9E8F77; padding: 0 0 12px 0; border-bottom: 1px solid #EDE8DF; }' +
      '.items-table thead th:last-child { text-align: right; }' +
      '.items-table thead th:nth-child(2) { text-align: center; }' +
      '.items-table tbody tr { border-bottom: 1px solid #F5F0E8; }' +
      '.items-table tbody tr:last-child { border-bottom: none; }' +
      '.items-table tbody td { padding: 16px 0; vertical-align: middle; }' +
      '.item-product { display: flex; align-items: center; gap: 14px; }' +
      '.item-name { font-size: 14.5px; font-weight: 500; color: #1A1208; margin-bottom: 2px; }' +
      '.item-variant { font-size: 12px; color: #9E8F77; }' +
      '.item-qty { text-align: center; font-size: 14px; color: #3D2F1A; }' +
      '.qty-badge { display: inline-block; background: #F5F0E8; border: 1px solid #EDE8DF; border-radius: 6px; padding: 3px 10px; font-weight: 500; font-size: 13px; color: #3D2F1A; }' +
      '.item-price { text-align: right; font-size: 14.5px; font-weight: 500; color: #1A1208; }' +
      '.totals-block { background: #FAF7F2; border: 1px solid #EDE8DF; border-radius: 12px; padding: 20px 24px; margin-top: 20px; margin-bottom: 28px; }' +
      '.totals-row { display: flex; justify-content: space-between; align-items: center; font-size: 13.5px; color: #7A6A54; padding: 5px 0; }' +
      '.totals-row.grand-total { border-top: 1px solid #EDE8DF; margin-top: 10px; padding-top: 14px; }' +
      '.totals-row.grand-total .total-label { font-size: 15px; font-weight: 600; color: #1A1208; }' +
      '.totals-row.grand-total .total-value { font-family: "DM Serif Display", Georgia, serif; font-size: 22px; color: #1A1208; }' +
      '.info-grid { display: flex; gap: 16px; margin-bottom: 28px; }' +
      '.info-card { flex: 1; background: #FAF7F2; border: 1px solid #EDE8DF; border-radius: 12px; padding: 18px 20px; }' +
      '.info-card-title { font-size: 10.5px; font-weight: 600; letter-spacing: 0.16em; text-transform: uppercase; color: #9E8F77; margin-bottom: 10px; display: flex; align-items: center; gap: 7px; }' +
      '.info-card p { font-size: 13.5px; color: #3D2F1A; line-height: 1.65; }' +
      '.highlight-tag { display: inline-block; background: #FFF5E0; border: 1px solid #F0C96A; color: #8A5E0A; font-size: 11.5px; font-weight: 600; padding: 3px 10px; border-radius: 6px; margin-top: 6px; }' +
      '.notes-block { background: #FFFBF2; border-left: 3px solid #D4A34C; border-radius: 0 8px 8px 0; padding: 14px 18px; margin-bottom: 28px; }' +
      '.notes-label { font-size: 10.5px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: #D4A34C; margin-bottom: 5px; }' +
      '.notes-block p { font-size: 13.5px; color: #5A4830; font-style: italic; line-height: 1.6; }' +
      '.footer { background-color: #1A1208; border-radius: 0 0 16px 16px; padding: 30px 48px; text-align: center; }' +
      '.footer-divider { width: 40px; height: 2px; background: linear-gradient(90deg, #D4A34C, #F0C96A); margin: 0 auto 20px; border-radius: 2px; }' +
      '.footer p { font-size: 12.5px; color: rgba(245,240,232,0.4); line-height: 1.7; }' +
      '.footer a { color: rgba(255,246,230,0.8); text-decoration: none; }' +
      '@media (max-width: 480px) { .body { padding: 32px 24px; } .header { padding: 28px 24px 24px; } .header h1 { font-size: 28px; } .order-meta { flex-direction: column; } .order-timestamp { text-align: left; } .info-grid { flex-direction: column; } .footer { padding: 24px; } }' +
    '</style></head><body>' +
    '<div class="email-wrapper"><div class="email-container">' +

    // Header
    '<div class="header">' +
      '<div class="brand-logo"><span class="brand-name">VINZ VAULT</span></div>' +
      '<div><div class="new-order-badge">🔔 New Order Alert</div></div>' +
      '<h1>You\'ve got an order<br/>to prepare!</h1>' +
      '<p class="header-subtitle">A customer just placed a new order. Review and get it ready.</p>' +
    '</div>' +

    // Body
    '<div class="body">' +

    // Order Meta
    '<div class="order-meta">' +
      '<div class="order-id-block">' +
        '<div class="order-id-label">Order Number</div>' +
        '<div class="order-id-value">#' + escapeHtml(String(data.number || data.id)) + '</div>' +
        getStatusPillHtml(data.status) +
      '</div>' +
      '<div class="order-timestamp">' +
        '<div class="ts-label">Placed On</div>' +
        '<div class="ts-value">' + escapeHtml(orderDate.dateLine) + '</div>' +
        '<div class="ts-value">' + escapeHtml(orderDate.timeLine) + '</div>' +
      '</div>' +
    '</div>' +

    // Customer
    '<div class="section-title">Customer</div>' +
    '<div class="customer-card">' +
      '<div class="customer-info">' +
        '<div class="customer-name">' + escapeHtml(customerName) + '</div>' +
        '<div class="customer-details">' +
          escapeHtml(data.billing.email || "") + '<br/>' +
          escapeHtml(data.billing.phone || "") +
        '</div>' +
      '</div>' +
    '</div>' +

    // Items
    '<div class="section-title">Order Items</div>' +
    '<table class="items-table"><thead><tr>' +
      '<th style="text-align:left;">Product</th><th>Qty</th><th>Price</th>' +
    '</tr></thead><tbody>' +
    buildItemRowsHtml(data.line_items) +
    '</tbody></table>' +

    // Totals
    '<div class="totals-block">' +
      '<div class="totals-row"><span>Subtotal</span><span>Rs. ' + subtotal.toFixed(2) + '</span></div>' +
      '<div class="totals-row"><span>Shipping</span><span>Rs. ' + shippingTotal.toFixed(2) + '</span></div>' +
      couponLines +
      '<div class="totals-row grand-total">' +
        '<span class="total-label">Total Charged</span>' +
        '<span class="total-value">Rs. ' + grandTotal.toFixed(2) + '</span>' +
      '</div>' +
    '</div>' +

    // Delivery & Payment
    '<div class="info-grid">' +
      '<div class="info-card">' +
        '<div class="info-card-title">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke="#9E8F77" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke="#9E8F77" stroke-width="2"/></svg>' +
          'Delivery Address' +
        '</div>' +
        '<p>' + addressBlock + '</p>' +
      '</div>' +
      '<div class="info-card">' +
        '<div class="info-card-title">' +
          '<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><rect x="1" y="4" width="22" height="16" rx="2" ry="2" stroke="#9E8F77" stroke-width="2"/><line x1="1" y1="10" x2="23" y2="10" stroke="#9E8F77" stroke-width="2"/></svg>' +
          'Payment' +
        '</div>' +
        '<p>' + escapeHtml(data.payment_method_title || "N/A") + '<br/>District: ' + escapeHtml(district) + '</p>' +
        getPaymentTagHtml(data.payment_method_title, data.status) +
      '</div>' +
    '</div>' +

    // Customer note
    notesBlock +

    '</div>' + // /body

    // Footer
    '<div class="footer">' +
      '<p>This notification was sent by <a href="#">spyteLabs</a> on behalf of <a href="#">Vinz Vault</a></p>' +
    '</div>' +

    '</div></div></body></html>';

  return html;
}
