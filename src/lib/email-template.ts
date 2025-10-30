// Centralized, professional email template for the entire platform
// Usage: renderCompanyEmail({ title, preheader, bodyHtml, ... })

export type EmailCta = {
	label: string;
	url: string;
	style?: "primary" | "secondary";
};

export type CompanyEmailOptions = {
	title?: string;
	preheader?: string;
	bodyHtml: string; // inner HTML already sanitized/encoded by caller
	primaryCta?: EmailCta;
	secondaryCta?: EmailCta;
	footerExtrasHtml?: string; // optional extra footer notes
	brandName?: string;
	brandTagline?: string;
	brandingColor?: string; // hex
	logoUrl?: string; // absolute URL to logo
	unsubscribeUrl?: string;
	helpCenterUrl?: string;
};

export function renderCompanyEmail(options: CompanyEmailOptions): string {
	const brandName =
		options.brandName || process.env.NEXT_PUBLIC_BRAND_NAME || "EduMatch";
	const brandTagline =
		options.brandTagline ||
		"Connecting students and institutions worldwide";
	const primaryColor = options.brandingColor || "#126E64";
	const accentColor = shadeColor(primaryColor, -10);
	const lightBg = "#f7f7fb";
	const contentBg = "#ffffff";
	const textColor = "#1f2937";
	const mutedText = "#6b7280";
	const borderColor = "#e5e7eb";
	const logoUrl =
		options.logoUrl ||
		process.env.NEXT_PUBLIC_BRAND_LOGO ||
		`${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://edumatch.app"}/edumatch_logo.svg`;
	const helpCenterUrl =
		options.helpCenterUrl ||
		`${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "https://edumatch.app"}/support`;
	const unsubscribeUrl = options.unsubscribeUrl;
	const preheader = options.preheader || "";
	const title = options.title || brandName;

	const primaryCtaHtml = options.primaryCta
		? renderButton(
				options.primaryCta.label,
				options.primaryCta.url,
				primaryColor
			)
		: "";
	const secondaryCtaHtml = options.secondaryCta
		? renderButton(
				options.secondaryCta.label,
				options.secondaryCta.url,
				"#374151"
			)
		: "";

	return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(title)}</title>
  <style>
    html, body { margin: 0; padding: 0; background: ${lightBg}; }
    body { font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, 'Helvetica Neue', Arial, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'; color: ${textColor}; }
    .container { width: 100%; max-width: 640px; margin: 0 auto; padding: 24px 16px; }
    .card { background: ${contentBg}; border: 1px solid ${borderColor}; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.04); }
    .header { background: linear-gradient(135deg, ${primaryColor}, ${accentColor}); padding: 28px 24px; color: #fff; }
    .brand { display: flex; align-items: center; gap: 12px; }
    .brand img { height: 36px; width: 36px; border-radius: 8px; background: rgba(255,255,255,0.9); }
    .brand h1 { margin: 0; font-size: 18px; line-height: 1.2; }
    .brand p { margin: 4px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .title { margin: 0 0 12px; font-size: 20px; font-weight: 600; }
    .muted { color: ${mutedText}; font-size: 14px; }
    .body { margin-top: 12px; font-size: 15px; line-height: 1.6; color: ${textColor}; }
    .cta { margin: 20px 0 6px; display: flex; gap: 12px; flex-wrap: wrap; }
    .button { display: inline-block; padding: 12px 18px; border-radius: 8px; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; }
    .divider { height: 1px; background: ${borderColor}; margin: 8px 0 0; }
    .footer { padding: 16px 24px 22px; }
    .footer-links a { color: ${mutedText}; text-decoration: underline; }
    .preheader { display: none !important; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0; overflow: hidden; }

    @media (prefers-color-scheme: dark) {
      html, body { background: #0b1220; }
      .card { background: #0f172a; border-color: #1f2937; }
      .content { color: #e5e7eb; }
      .muted { color: #9ca3af; }
      .divider { background: #1f2937; }
      .button.secondary { background: #4b5563 !important; }
    }
    @media only screen and (max-width: 480px) {
      .content { padding: 20px; }
      .footer { padding: 16px 20px 20px; }
    }
  </style>
</head>
<body>
  <div class="preheader">${escapeHtml(preheader)}</div>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="brand">
          <img src="${logoUrl}" alt="${escapeHtml(brandName)}" />
          <div>
            <h1>${escapeHtml(brandName)}</h1>
            <p>${escapeHtml(brandTagline)}</p>
          </div>
        </div>
      </div>
      <div class="content">
        ${title ? `<div class="title">${escapeHtml(title)}</div>` : ""}
        <div class="body">${options.bodyHtml}</div>
        ${
			primaryCtaHtml || secondaryCtaHtml
				? `<div class="cta">${primaryCtaHtml}${secondaryCtaHtml}</div>`
				: ""
		}
      </div>
      <div class="divider"></div>
      <div class="footer">
        ${options.footerExtrasHtml || ""}
        <div class="muted" style="margin-top: 8px;">
          <div class="footer-links">
            <a href="${helpCenterUrl}">Help center</a>
            ${unsubscribeUrl ? ` • <a href="${unsubscribeUrl}">Unsubscribe</a>` : ""}
          </div>
          <div style="margin-top: 10px;">
            © ${new Date().getFullYear()} ${escapeHtml(brandName)}. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function renderButton(label: string, url: string, color: string): string {
	return `<a class="button" href="${url}" style="background:${color};">${escapeHtml(
		label
	)}</a>`;
}

function escapeHtml(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

function shadeColor(hex: string, percent: number): string {
	// Simple hex shade utility
	const f = parseInt(hex.slice(1), 16);
	const t = percent < 0 ? 0 : 255;
	const p = Math.abs(percent) / 100;
	const R = f >> 16;
	const G = (f >> 8) & 0x00ff;
	const B = f & 0x0000ff;
	const newR = Math.round((t - R) * p) + R;
	const newG = Math.round((t - G) * p) + G;
	const newB = Math.round((t - B) * p) + B;
	return `#${(0x1000000 + (newR << 16) + (newG << 8) + newB)
		.toString(16)
		.slice(1)}`;
}
