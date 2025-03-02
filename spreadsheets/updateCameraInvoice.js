import { initGoogleSheets } from '../utils/initGoogleSheets.js';

async function findAndUpdateInvoice(sheets, cameraJumpInfo, spreadsheetId) {
    try {
      const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId,
        fields: 'sheets.properties'
      });
      
      const sheetsList = response.data.sheets;
      
      // Filter out the template sheet and sort sheets (assuming a naming convention like "Month_Year")
      const monthSheets = sheetsList
        .map(sheet => sheet.properties)
        .filter(properties => properties.title !== 'Invoice Template')
        .sort((a, b) => {
          // Sort by sheet index (assuming newer sheets are added after older ones)
          return b.index - a.index;
        });
      
      let targetSheetId;
      let targetSheetTitle;
      let createNewSheet = false;
      
      // Function to check if we need a new invoice (if we've reached a new billing period)
      const needsNewInvoice = () => {
        // If no sheets exist yet, we definitely need one
        if (monthSheets.length === 0) return true;
        
        const current = new Date();
        const currentMonth = current.getMonth();
        const currentYear = current.getFullYear();
        
        // Check if most recent sheet is from current month/year
        const mostRecentSheetTitle = monthSheets[0].title;
        // Assuming title format is like "March_2025"
        const [sheetMonth, sheetYear] = mostRecentSheetTitle.split('_');
        const sheetMonthIndex = new Date(`${sheetMonth} 1, ${sheetYear}`).getMonth();
        const sheetYearNum = parseInt(sheetYear);
        
        // If the most recent sheet is from a previous month/year, we need a new one
        if (sheetYearNum < currentYear || (sheetYearNum === currentYear && sheetMonthIndex < currentMonth)) {
          return true;
        }
        
        // Check if we've passed the last Sunday of the current month
        // Get the last Sunday of the most recent sheet's month
        const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        let lastSundayOfMonth = new Date(currentYear, currentMonth, lastDayOfMonth);
        
        // Adjust to get the last Sunday
        while (lastSundayOfMonth.getDay() !== 0) { // 0 is Sunday
          lastSundayOfMonth = new Date(lastSundayOfMonth.setDate(lastSundayOfMonth.getDate() - 1));
        }
        
        // If today is after the last Sunday of the month, and we're still in the same month as the sheet,
        // then we need a new sheet for the next month
        return current > lastSundayOfMonth && currentMonth === sheetMonthIndex;
      };
      
      if (needsNewInvoice()) {
        createNewSheet = true;
      } else if (monthSheets.length > 0) {
        // Use the most recent sheet
        targetSheetId = monthSheets[0].sheetId;
        targetSheetTitle = monthSheets[0].title;
      }
      
      if (createNewSheet) {
        // Determine the month and year for the new sheet
        // If we've passed the last Sunday of the current month, use next month
        const nextMonth = new Date();
        
        // Check if we're past the last Sunday of the current month
        const lastDayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
        let lastSundayOfMonth = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), lastDayOfMonth);
        
        // Adjust to get the last Sunday
        while (lastSundayOfMonth.getDay() !== 0) { // 0 is Sunday
          lastSundayOfMonth = new Date(lastSundayOfMonth.setDate(lastSundayOfMonth.getDate() - 1));
        }

        const current = new Date();
        
        // If today is after the last Sunday, use the next month for the new sheet
        if (current > lastSundayOfMonth) {
          nextMonth.setMonth(nextMonth.getMonth() + 1);
        }
        
        const newSheetTitle = `${nextMonth.toLocaleString('default', { month: 'long' })}_${nextMonth.getFullYear()}`;
        
        // Find the template sheet
        const templateSheet = sheetsList
          .map(sheet => sheet.properties)
          .find(properties => properties.title === 'Invoice Template');
        
        if (!templateSheet) {
          throw new Error('Template sheet not found');
        }
        
        // Duplicate the template sheet
        const duplicateResponse = await sheets.spreadsheets.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            requests: [
              {
                duplicateSheet: {
                  sourceSheetId: templateSheet.sheetId,
                  insertSheetIndex: sheetsList.length,
                  newSheetName: newSheetTitle
                }
              }
            ]
          }
        });
        
        targetSheetId = duplicateResponse.data.replies[0].duplicateSheet.properties.sheetId;
        targetSheetTitle = newSheetTitle;
        
        // Update invoice date with the last Sunday of this new month
        const invoiceDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0);
        while (invoiceDate.getDay() !== 0) {
          invoiceDate.setDate(invoiceDate.getDate() - 1);
        }
        
        const formattedInvoiceDate = `${invoiceDate.getDate()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getFullYear()}`;
        
        // Update the DATE field in the template
        await sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId,
          range: `${targetSheetTitle}!B4`, // DATE: field
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: [[formattedInvoiceDate]]
          }
        });
      }
      
      // Get existing data from the target sheet
      const dataResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: `${targetSheetTitle}!A1:H30`
      });
      
      const existingData = dataResponse.data.values || [];
      
      // Find the row where we need to add data (after the last entry)
      let lastRowIndex = 15; // Default starting row (based on your template screenshot)
      
      // Find the last row with data in the customer column
      for (let i = 15; i < existingData.length; i++) {
        if (existingData[i] && existingData[i][3]) { // Column D (index 3) is CUSTOMER
          lastRowIndex = i + 1;
        }
      }
      
      // Prepare updates for each camera jump
      const updates = [];
      
      cameraJumpInfo.forEach((jump, index) => {
        const rowIndex = lastRowIndex + index;
        
        // Format the date as DD/MM/YYYY
        const jumpDate = new Date(jump.date);
        const formattedDate = `${jumpDate.getDate()}/${jumpDate.getMonth() + 1}/${jumpDate.getFullYear()}`;
        
        // Prepare the row update
        updates.push({
          range: `${targetSheetTitle}!A${rowIndex}:D${rowIndex}`,
          values: [
            [index + 1, formattedDate, "", jump.studentName] // NO., DATE, empty column, CUSTOMER
          ]
        });
      });
      
      // Apply the updates
      if (updates.length > 0) {
        await sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: spreadsheetId,
          resource: {
            valueInputOption: 'USER_ENTERED',
            data: updates
          }
        });
      }
      
      return {
        success: true,
        sheetStatus: createNewSheet ? 'created' : 'updated',
        sheetTitle: targetSheetTitle,
        message: createNewSheet 
          ? `Created new invoice sheet "${targetSheetTitle}" and added ${cameraJumpInfo.length} camera jumps` 
          : `Updated ${cameraJumpInfo.length} camera jumps in existing sheet "${targetSheetTitle}"`
      };
      
    } catch (error) {
      console.error('Error updating invoice:', error);
      return {
        success: false,
        message: `Error updating invoice: ${error.message}`
      };
    }
  }

export async function updateCameraInvoice(cameraJumpInfo, spreadsheetId) {
  try {
    const sheets = await initGoogleSheets();
    
    const result = await findAndUpdateInvoice(
      sheets,
      cameraJumpInfo,
      spreadsheetId,
    );
    
    console.log(result.message);
    return result;
    
  } catch (error) {
    console.error('Error in updateCameraInvoice:', error);
    return {
      success: false,
      message: `Error in updateCameraInvoice: ${error.message}`
    };
  }
}

async function testInvoiceUpdate() {
    const spreadsheetId = '16gVb5zEW8iMGOimouAK1OQjiCXHCsH-yeaijkWWeiOQ';
    
    // Sample camera jump data for testing
    const cameraJumpInfo = [
      {
        date: "2025-03-02",
        studentName: "John Doe",
      },
      {
        date: "2025-03-02", 
        studentName: "Jane Smith",
      }
    ];
  
    try {
      console.log("Starting test...");
      const result = await updateCameraInvoice(cameraJumpInfo, spreadsheetId);
      console.log("Test result:", result);
    } catch (error) {
      console.error("Test failed:", error);
    }
}

// Run the test
testInvoiceUpdate();