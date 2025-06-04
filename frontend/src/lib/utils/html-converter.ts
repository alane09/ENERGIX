/**
 * Utility functions for converting HTML content to different formats
 */

/**
 * Convert HTML content to plain text
 * @param html HTML content
 * @returns Plain text
 */
export function htmlToText(html: string): string {
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Get text content
  return tempElement.textContent || tempElement.innerText || '';
}

/**
 * Extract headings from HTML content
 * @param html HTML content
 * @returns Array of headings with their level and text
 */
export function extractHeadings(html: string): { level: number; text: string }[] {
  const headings: { level: number; text: string }[] = [];
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Find all heading elements
  const headingElements = tempElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  // Extract level and text from each heading
  headingElements.forEach((heading) => {
    const level = parseInt(heading.tagName.substring(1), 10);
    const text = heading.textContent || '';
    headings.push({ level, text });
  });
  
  return headings;
}

/**
 * Extract tables from HTML content
 * @param html HTML content
 * @returns Array of tables with headers and rows
 */
export function extractTables(html: string): { headers: string[]; rows: string[][] }[] {
  const tables: { headers: string[]; rows: string[][] }[] = [];
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Find all table elements
  const tableElements = tempElement.querySelectorAll('table');
  
  // Extract headers and rows from each table
  tableElements.forEach((table) => {
    const headers: string[] = [];
    const rows: string[][] = [];
    
    // Extract headers
    const headerRow = table.querySelector('thead tr');
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th');
      headerCells.forEach((cell) => {
        headers.push(cell.textContent || '');
      });
    }
    
    // Extract rows
    const bodyRows = table.querySelectorAll('tbody tr');
    bodyRows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      const rowData: string[] = [];
      cells.forEach((cell) => {
        rowData.push(cell.textContent || '');
      });
      rows.push(rowData);
    });
    
    tables.push({ headers, rows });
  });
  
  return tables;
}

/**
 * Extract images from HTML content
 * @param html HTML content
 * @returns Array of image sources and alt text
 */
export function extractImages(html: string): { src: string; alt: string }[] {
  const images: { src: string; alt: string }[] = [];
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Find all image elements
  const imageElements = tempElement.querySelectorAll('img');
  
  // Extract src and alt from each image
  imageElements.forEach((image) => {
    const src = image.getAttribute('src') || '';
    const alt = image.getAttribute('alt') || '';
    images.push({ src, alt });
  });
  
  return images;
}

/**
 * Extract sections from HTML content
 * @param html HTML content
 * @returns Array of sections with title and content
 */
export function extractSections(html: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Find all heading elements
  const headingElements = tempElement.querySelectorAll('h1, h2, h3, h4, h5, h6');
  
  // Extract sections
  headingElements.forEach((heading, index) => {
    const title = heading.textContent || '';
    let content = '';
    
    // Get all elements until the next heading
    let nextElement = heading.nextElementSibling;
    while (nextElement && !nextElement.tagName.match(/^H[1-6]$/)) {
      content += nextElement.outerHTML;
      nextElement = nextElement.nextElementSibling;
    }
    
    sections.push({ title, content });
  });
  
  return sections;
}

/**
 * Clean HTML content for export
 * @param html HTML content
 * @returns Cleaned HTML content
 */
export function cleanHtml(html: string): string {
  // Create a temporary DOM element
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  
  // Remove script tags
  const scriptTags = tempElement.querySelectorAll('script');
  scriptTags.forEach((tag) => {
    tag.remove();
  });
  
  // Remove style tags
  const styleTags = tempElement.querySelectorAll('style');
  styleTags.forEach((tag) => {
    tag.remove();
  });
  
  // Remove comments
  const commentNodes = [];
  const walker = document.createTreeWalker(
    tempElement,
    NodeFilter.SHOW_COMMENT,
    null
  );
  let node;
  while ((node = walker.nextNode())) {
    commentNodes.push(node);
  }
  commentNodes.forEach((node) => {
    node.parentNode?.removeChild(node);
  });
  
  return tempElement.innerHTML;
}
