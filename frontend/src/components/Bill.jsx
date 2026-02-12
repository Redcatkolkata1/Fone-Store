// src/components/Bill.jsx
import React, { useRef } from "react";
import "./Bill.css";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// adjust the path to where billogo.png is in your project
import billLogo from "../assets/billogo.png";

function formatINR(value) {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Bill({ open, onClose, invoice }) {
  const contentRef = useRef(null);

  if (!open || !invoice) return null;

  const {
    invoiceNumber,
    invoiceDate,
    customer,
    items = [],
    subtotal = 0,
    discount = 0,

    // margin still received for tax calculation on the billing page,
    // but we no longer display it in the PDF.
    margin = 0,

    cgstPercent = 0,
    cgstAmount = 0,
    sgstPercent = 0,
    sgstAmount = 0,
    igstPercent = 0,
    igstAmount = 0,
    taxAmount = 0,
    total = 0,
    paymentMethod = "cash",
  } = invoice;

  const paymentModeLabel =
    paymentMethod === "card" ? "Card" : paymentMethod === "upi" ? "UPI" : "Cash";

  // Determine if this is an Accessory bill (no mixing is allowed in Billing.jsx)
  const isAccessoryBill =
    items.length > 0 && items[0].type && items[0].type === "accessory";

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  };

  // Multi-page PDF generator using html2canvas + jsPDF
  const handleDownloadPDF = async () => {
    if (!contentRef.current) return;

    try {
      const canvas = await html2canvas(contentRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgPxWidth = canvas.width;
      const imgPxHeight = canvas.height;

      const pxPerMm = imgPxWidth / pdfWidth;
      const pageHeightPx = Math.floor(pdfHeight * pxPerMm);

      let y = 0;
      while (y < imgPxHeight) {
        const remaining = imgPxHeight - y;
        const cutHeight = Math.min(pageHeightPx, remaining);

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = imgPxWidth;
        pageCanvas.height = cutHeight;
        const ctx = pageCanvas.getContext("2d");

        ctx.drawImage(
          canvas,
          0,
          y,
          imgPxWidth,
          cutHeight,
          0,
          0,
          imgPxWidth,
          cutHeight
        );

        const pageData = pageCanvas.toDataURL("image/png");
        const pageImgHeightMm = cutHeight / pxPerMm;

        const marginX = 10;
        const imgWidthMm = pdfWidth - marginX * 2;

        if (y > 0) pdf.addPage();
        pdf.addImage(pageData, "PNG", marginX, 10, imgWidthMm, pageImgHeightMm);

        y += cutHeight;
      }

      pdf.save(`Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Unable to generate PDF. See console for details.");
    }
  };

  // Print only the bill content
  const handlePrint = () => {
    if (!contentRef.current) return;

    const printContents = contentRef.current.innerHTML;

    const printWindow = window.open("", "", "width=900,height=650");
    if (!printWindow) return;

    // bring over all styles so the print looks like the on-screen bill
    const styles = Array.from(
      document.querySelectorAll("style, link[rel='stylesheet']")
    )
      .map((node) => node.outerHTML)
      .join("");

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice-${invoiceNumber}</title>
          ${styles}
        </head>
        <body>
          ${printContents}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  // helper: per-row discount / payable (pro-rata split of total discount)
  const overallDiscount = Number(discount || 0);
  const safeSubtotal =
    subtotal ||
    items.reduce((s, it) => s + Number(it.price || 0) * Number(it.qty || 1), 0);

  // ✅ Mobile HSN
  const HSN_CODE = "85171300";

  // ✅ HSN mapping for accessories
  const ACCESSORY_HSN_MAP = {
    "data cable": "85444299",
    "adapter": "85044090",
    "headphone": "85183000",
    "screen guard": "39269099",
    "back cover": "39269099",
  };

  // ✅ Detect accessory HSN based on accessory name
  const getAccessoryHSN = (name) => {
    const n = String(name || "").toLowerCase().trim();

    // exact match
    if (ACCESSORY_HSN_MAP[n]) return ACCESSORY_HSN_MAP[n];

    // partial match (more tolerant)
    if (n.includes("data") && n.includes("cable")) return ACCESSORY_HSN_MAP["data cable"];
    if (n.includes("adapter")) return ACCESSORY_HSN_MAP["adapter"];
    if (n.includes("headphone") || n.includes("neckband") || n.includes("earphone"))
      return ACCESSORY_HSN_MAP["headphone"];
    if (n.includes("screen") && (n.includes("guard") || n.includes("protector")))
      return ACCESSORY_HSN_MAP["screen guard"];
    if (n.includes("back") && (n.includes("cover") || n.includes("case")))
      return ACCESSORY_HSN_MAP["back cover"];

    return "N/A";
  };

  return (
    <dialog
      open={open}
      className="bill-dialog"
      onClick={handleBackdropClick}
      aria-modal="true"
      aria-labelledby="bill-title"
    >
      <div className="bill-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="bill-close"
          aria-label="Close invoice"
          onClick={onClose}
        >
          ✕
        </button>

        {/* EVERYTHING inside bill-outer-box is what goes to PDF / Print */}
        <div ref={contentRef} className="bill-outer-box">
          {/* =================== TAX INVOICE BOX (with border) =================== */}
          <div
            className="invoice-frame"
            style={{
              border: "1px solid #000",
              padding: "10px 10px 12px",
              marginBottom: 8,
            }}
          >
            {/* TOP: LOGO + TITLE */}
            <header className="bill-header">
              <div className="bill-header-top">
                <div className="bill-logo-slot">
                  <img
                    src={billLogo}
                    alt="Fone Store logo"
                    className="bill-logo"
                  />
                </div>
                <div className="bill-title-row">
                  <h2 id="bill-title">Tax Invoice</h2>
                </div>
                {/* right spacer so title stays visually centered */}
                <div className="bill-header-top-spacer" />
              </div>

              <div className="bill-header-main">
                {/* LEFT: Fone Store details */}
                <div className="bill-store">
                  <div>Redcat Hospitality Pvt. Ltd.</div>
                  <div>
                    <span className="label-inline">Phone No:</span> +91-8420633207
                  </div>
                  <div>
                    <span className="label-inline">Email:</span>{" "}
                    it@redcathospitality.com
                  </div>
                  <div>
                    <span className="label-inline">Address:</span> 146,
                    Rajarhat Road, Teghoria, P.S - Baguihati, Kolkata - 700 157.
                  </div>
                  <div>
                    <span className="label-inline">GSTIN:</span> 19AAKCR9587Q1ZX
                  </div>
                  <div>
                    <span className="label-inline">CIN:</span> U51909HR2021PTC094649
                  </div>
                </div>

                {/* RIGHT: Invoice meta */}
                <div className="bill-meta">
                  <div className="bill-meta-row">
                    <span>Invoice No:</span>
                    <span>{invoiceNumber}</span>
                  </div>
                  <div className="bill-meta-row">
                    <span>Invoice Date:</span>
                    <span>{invoiceDate}</span>
                  </div>
                  <div className="bill-meta-row">
                    <span>Payment Mode:</span>
                    <span>{paymentModeLabel}</span>
                  </div>
                </div>
              </div>
            </header>

            {/* CUSTOMER DETAILS */}
            <section className="bill-section bill-customer-section">
              <div className="bill-section-title">Customer Details</div>
              <div className="bill-customer">
                <div>
                  <strong>Name:</strong> {customer?.name || "-"}
                </div>
                <div>
                  <strong>Phone:</strong> {customer?.phone || "-"}
                </div>

                {customer?.email && customer.email.trim() !== "" && (
                  <div>
                    <strong>Email:</strong> {customer.email}
                  </div>
                )}

                <div>
                  <strong>Address:</strong> {customer?.address || "-"}
                </div>
              </div>
            </section>

            {/* INVOICE ITEMS TABLE */}
            <section className="bill-section">
              <div className="bill-section-title">Invoice Items</div>

              <table
                className="bill-table invoice-items-table"
                cellPadding="0"
                cellSpacing="0"
              >
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>S.No</th>
                    <th>Product</th>

                    {/* For accessories: Variant -> Type */}
                    <th>{isAccessoryBill ? "Type" : "Variant"}</th>

                    {/* For accessories: IMEI -> Model Number */}
                    <th style={{ width: 190 }}>
                      {isAccessoryBill ? "Model Number" : "IMEI"}
                    </th>

                    {/* Serial + Grade ONLY for mobiles */}
                    {!isAccessoryBill && (
                      <>
                        <th style={{ width: 60 }}>Serial Number</th>
                        <th style={{ width: 90 }}>Grade</th>
                      </>
                    )}

                    {/* ✅ Now HSN only (Accessories also use HSN) */}
                    <th style={{ width: 80 }}>HSN</th>

                    <th style={{ width: 50 }}>Qty</th>
                    <th style={{ width: 80 }}>Price (₹)</th>
                    <th style={{ width: 90 }}>Discount (₹)</th>
                    <th style={{ width: 90 }}>Amount (₹)</th>
                  </tr>
                </thead>

                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td
                        colSpan={isAccessoryBill ? 9 : 11}
                        style={{ textAlign: "center" }}
                      >
                        No items
                      </td>
                    </tr>
                  ) : (
                    items.map((it, idx) => {
                      const qty = Number(it.qty || 0);
                      const price = Number(it.price || 0);
                      const lineSubtotal = price * qty;

                      // pro-rata share of invoice-level discount
                      const lineDiscount =
                        safeSubtotal > 0 && overallDiscount
                          ? (lineSubtotal / safeSubtotal) * overallDiscount
                          : 0;

                      const linePayable = lineSubtotal - lineDiscount;

                      // product name without double brand
                      const brand = (it.brand || "").trim();
                      const model = (it.model || "").trim();
                      let productName = "";

                      if (it.type === "accessory") {
                        productName = brand || "-";
                      } else if (brand && model) {
                        if (model.toLowerCase().startsWith(brand.toLowerCase())) {
                          productName = model;
                        } else {
                          productName = `${brand} ${model}`.trim();
                        }
                      } else {
                        productName = brand || model || "-";
                      }

                      return (
                        <tr key={it.id || idx}>
                          <td>{idx + 1}</td>
                          <td>{productName}</td>

                          {/* Type / Variant cell */}
                          <td>{it.variant || "-"}</td>

                          {/* IMEI / Model Number cell */}
                          <td className="bill-imei-cell" style={{ width: 180 }}>
                            {isAccessoryBill ? (
                              it.model || "-"
                            ) : (
                              <>
                                {it.imei1 || "-"}
                                {it.imei2 ? (
                                  <>
                                    <br />
                                    {it.imei2}
                                  </>
                                ) : null}
                              </>
                            )}
                          </td>

                          {/* Serial + Grade ONLY for mobiles */}
                          {!isAccessoryBill && (
                            <>
                              <td style={{ textAlign: "center" }}>
                                {it.serialNumber &&
                                String(it.serialNumber).trim() !== ""
                                  ? it.serialNumber
                                  : "-"}
                              </td>

                              <td style={{ textAlign: "center" }}>
                                {it.condition && String(it.condition).trim() !== ""
                                  ? it.condition
                                  : "-"}
                              </td>
                            </>
                          )}

                          {/* ✅ HSN for Mobiles OR Accessories */}
                          <td style={{ textAlign: "center" }}>
                            {isAccessoryBill ? getAccessoryHSN(it.brand) : HSN_CODE}
                          </td>

                          <td style={{ textAlign: "center" }}>{qty}</td>

                          <td style={{ textAlign: "right" }}>
                            {formatINR(price)}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            {formatINR(lineDiscount)}
                          </td>

                          <td style={{ textAlign: "right" }}>
                            {formatINR(linePayable)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </section>

            {/* TAX + TOTAL + SIGNATURE AREA */}
            <section className="bill-tax-and-footer">
              {/* TAX BIFURCATION TABLE (LEFT) */}
              <table
                className="bill-table tax-bifurcation-table"
                cellPadding="0"
                cellSpacing="0"
              >
                <thead>
                  <tr>
                    <th rowSpan={2} style={{ width: 130 }}>
                      Tax Bifurcation
                    </th>
                    <th>CGST (9%)</th>
                    <th>SGST (9%)</th>
                    <th>IGST (0%)</th>
                  </tr>
                  <tr>
                    <th>CGST Amount</th>
                    <th>SGST Amount</th>
                    <th>IGST Amount</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ textAlign: "center" }}>&nbsp;</td>
                    <td style={{ textAlign: "right" }}>₹{formatINR(cgstAmount)}</td>
                    <td style={{ textAlign: "right" }}>₹{formatINR(sgstAmount)}</td>
                    <td style={{ textAlign: "right" }}>₹{formatINR(igstAmount)}</td>
                  </tr>
                </tbody>
              </table>

              {/* TOTALS */}
              <div className="bill-totals-signature">
                <div className="bill-summary-box">
                  <div className="bill-summary-row">
                    <span>Price</span>
                    <span>₹{formatINR(subtotal)}</span>
                  </div>
                  <div className="bill-summary-row">
                    <span>Discount</span>
                    <span>₹{formatINR(discount)}</span>
                  </div>
                  <div className="bill-summary-row">
                    <span>Total Tax</span>
                    <span>₹{formatINR(taxAmount)}</span>
                  </div>
                  <div className="bill-summary-row bill-summary-total">
                    <span>Total Payable</span>
                    <span>₹{formatINR(total)}</span>
                  </div>
                </div>
              </div>
            </section>

            {/* FOOTER NOTE */}
            <footer className="bill-footer-note">
              This is a computer generated invoice. Hence signature is not required.
            </footer>
          </div>

          {/* TERMS & CONDITIONS */}
          <section className="bill-section" style={{ marginTop: 6, fontSize: 11 }}>
            <div
              className="bill-section-title"
              style={{ marginBottom: 4, fontSize: 11, fontWeight: 700 }}
            >
              Terms and Conditions
            </div>
            <ol style={{ paddingLeft: 18, margin: 0, lineHeight: 1.4 }}>
              <li>Shipping and handling charges as indicated above.</li>
              <li>
                All goods returned for replacement/credit must be in saleable
                condition with original packing.
              </li>
              <li>
                The transaction is covered under margin scheme as per Notification
                No. 10/2017 – Central Tax (Rate) issued under CGST, Rule 32(5).
              </li>
              <li>
                We declare that this invoice shows the actual price of the goods
                described and that all particulars are true and correct.
              </li>
              <li>Goods once sold will not be taken back.</li>
              <li>All subject to Kolkata jurisdiction.</li>
            </ol>
          </section>
        </div>

        {/* ACTION BUTTONS */}
        <div className="bill-actions">
          <button type="button" className="bill-print-btn" onClick={handlePrint}>
            Print
          </button>

          <button type="button" className="bill-download-btn" onClick={handleDownloadPDF}>
            Download PDF
          </button>
        </div>
      </div>
    </dialog>
  );
}
