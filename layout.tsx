@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 210 20% 98%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 24% 94%;
  --muted-foreground: 215 16% 43%;
  --accent: 199 89% 94%;
  --accent-foreground: 201 96% 20%;
  --primary: 202 80% 24%;
  --primary-foreground: 0 0% 100%;
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --border: 214 22% 88%;
  --input: 214 22% 88%;
  --ring: 202 80% 24%;
  --radius: 0.5rem;
}

.dark {
  --background: 222 35% 7%;
  --foreground: 210 32% 92%;
  --card: 222 30% 10%;
  --card-foreground: 210 32% 92%;
  --muted: 221 24% 17%;
  --muted-foreground: 215 18% 70%;
  --accent: 204 42% 18%;
  --accent-foreground: 199 92% 88%;
  --primary: 199 82% 64%;
  --primary-foreground: 222 47% 9%;
  --destructive: 0 72% 56%;
  --destructive-foreground: 0 0% 100%;
  --border: 217 22% 22%;
  --input: 217 22% 24%;
  --ring: 199 82% 64%;
}

* {
  border-color: hsl(var(--border));
}

html {
  color-scheme: light;
}

html.dark {
  color-scheme: dark;
}

body {
  background: hsl(var(--background));
  color: hsl(var(--foreground));
}

button,
a,
input,
select,
textarea {
  outline-color: hsl(var(--ring));
}

@media print {
  @page {
    margin: 16mm;
  }

  * {
    color-adjust: exact;
    print-color-adjust: exact;
    -webkit-print-color-adjust: exact;
  }

  body {
    background: white;
    color: #111827;
    font-size: 11pt;
  }

  header,
  aside,
  nav,
  footer,
  button,
  [role="navigation"],
  .print\:hidden {
    display: none !important;
  }

  main {
    padding: 0 !important;
  }

  a {
    color: #111827;
    text-decoration: none;
  }

  .print-brief,
  .print-report {
    color: #111827;
  }

  .print-document-header {
    display: block !important;
    margin-bottom: 18px;
    border-bottom: 2px solid #111827;
    padding-bottom: 10px;
  }

  .print-document-title {
    font-size: 20pt !important;
    font-weight: 700;
    line-height: 1.2;
  }

  .print-document-meta {
    margin-top: 4px;
    color: #374151 !important;
    font-size: 9.5pt;
  }

  .print-card {
    break-inside: avoid;
    border-radius: 0 !important;
    box-shadow: none !important;
    border-color: #d1d5db !important;
    background: white !important;
  }

  .print-card + .print-card {
    margin-top: 16px;
  }

  .print-card > div:first-child {
    border-bottom-color: #9ca3af !important;
    padding: 10px 12px !important;
  }

  .print-card h2 {
    font-size: 13pt !important;
  }

  .print-card p,
  .print-card span,
  .print-card td,
  .print-card th {
    font-size: 9.5pt !important;
  }

  .print-card [class*="grid"] {
    gap: 8px !important;
  }

  .print-metric {
    border: 1px solid #d1d5db !important;
    border-radius: 0 !important;
    background: white !important;
    padding: 8px !important;
  }

  .print-metric-value {
    font-size: 16pt !important;
    line-height: 1.2;
  }

  .print-table table,
  table {
    min-width: 0 !important;
    width: 100% !important;
    border-collapse: collapse !important;
  }

  .print-table th,
  .print-table td,
  th,
  td {
    border: 1px solid #d1d5db !important;
    padding: 6px 8px !important;
    vertical-align: top;
  }

  .print-table thead,
  thead {
    display: table-header-group;
    background: #f3f4f6 !important;
  }

  tr,
  .print-avoid-break {
    break-inside: avoid;
  }
}
