
// Sample database schema data
export const schemaData = [
  {
    id: 'MYSQL_Distributions',
    title: 'MYSQL_Distributions',
    columns: [
      { name: 'PO_DISTRIBUTION_ID', type: 'key' },
      { name: 'LAST_UPDATE_DATE', type: 'date' },
      { name: 'LAST_UPDATED_BY', type: 'key' },
      { name: 'PO_HEADER_ID', type: 'key' },
      { name: 'PO_LINE_ID', type: 'key' },
      { name: 'LINE_LOCATION_ID', type: 'key' },
      { name: 'SET_OF_BOOKS_ID', type: 'key' },
      { name: 'CODE_COMBINATION_ID', type: 'key' },
      { name: 'QUANTITY_ORDERED', type: 'key' },
      { name: 'LAST_UPDATE_LOGIN', type: 'key' },
    ],
    position: { x: 20, y: 50 }
  },
  {
    id: 'MYSQL_Employees',
    title: 'MYSQL_Employees',
    columns: [
      { name: 'EmpID', type: 'key' },
      { name: 'LastName', type: 'text' },
      { name: 'FirstName', type: 'text' },
      { name: 'Address', type: 'text' },
      { name: 'Salary', type: 'number' },
      { name: 'City', type: 'text' }
    ],
    position: { x: 360, y: 50 }
  },
  {
    id: 'MYSQL_Headers',
    title: 'MYSQL_Headers',
    columns: [
      { name: 'PO_HEADER_ID', type: 'key' },
      { name: 'AGENT_ID', type: 'key' },
      { name: 'TYPE_LOOKUP_CODE', type: 'text' },
      { name: 'LAST_UPDATE_DATE', type: 'date' },
      { name: 'LAST_UPDATED_BY', type: 'key' },
      { name: 'SEGMENT1', type: 'text' },
      { name: 'SUMMARY_FLAG', type: 'flag' },
      { name: 'ENABLED_FLAG', type: 'flag' },
      { name: 'SEGMENT2', type: 'text' },
      { name: 'SEGMENT3', type: 'text' }
    ],
    position: { x: 20, y: 350 }
  },
  {
    id: 'MYSQL_Invoice_Dist',
    title: 'MYSQL_Invoice_Dist',
    columns: [
      { name: 'ACCOUNTING_DATE', type: 'date' },
      { name: 'ACCRUAL_POSTED_FLAG', type: 'flag' },
      { name: 'ASSETS_ADDITION_FLAG', type: 'flag' },
      { name: 'ASSETS_TRACKING_FLAG', type: 'flag' },
      { name: 'CASH_POSTED_FLAG', type: 'flag' },
      { name: 'DISTRIBUTION_LINE_NUMBER', type: 'number' },
      { name: 'DIST_CODE_COMBINATION_ID', type: 'key' },
      { name: 'INVOICE_ID', type: 'key' },
      { name: 'LAST_UPDATED_BY', type: 'key' },
      { name: 'LAST_UPDATE_DATE', type: 'date' }
    ],
    position: { x: 360, y: 350 }
  }
];

// Sample relation data
export const relationData = [
  {
    from: 'MYSQL_Headers',
    to: 'MYSQL_Distributions',
    fromField: 'PO_HEADER_ID',
    toField: 'PO_HEADER_ID'
  },
  {
    from: 'MYSQL_Employees',
    to: 'MYSQL_Headers',
    fromField: 'EmpID',
    toField: 'AGENT_ID'
  },
  {
    from: 'MYSQL_Invoice_Dist',
    to: 'MYSQL_Headers',
    fromField: 'LAST_UPDATED_BY',
    toField: 'LAST_UPDATED_BY'
  }
];

// List of schemas to display
export const displayedSchemasList = [
  'MYSQL_Distributions', 
  'MYSQL_Employees', 
  'MYSQL_Headers', 
  'MYSQL_Invoice_Dist'
];

// Model data 
export const modelsList = [
  { id: 1, name: 'MYSQL_Distributions' },
  { id: 2, name: 'MYSQL_Employees' },
  { id: 3, name: 'MYSQL_Headers' },
  { id: 4, name: 'MYSQL_Invoice_Dist' },
  { id: 5, name: 'MYSQL_Invoice_Lines' },
  { id: 6, name: 'MYSQL_Lines' },
  { id: 7, name: 'MYSQL_MI_Items' },
  { id: 8, name: 'MYSQL_Invoice' }
];
