const { google } = require('googleapis');

class SkydiveAnalyticsSetup {
    constructor(auth) {
        this.sheets = google.sheets({ version: 'v4', auth });
    }

    async setupAnalyticsSheet(spreadsheetId) {
        try {
            // Create the Analytics sheet if it doesn't exist
            await this.createAnalyticsSheet(spreadsheetId);
            
            // Add all the live formulas
            const formulas = [
                ['Jump Statistics', '', '', 'Time Analysis', '', '', 'Equipment Analysis'],
                [
                    'Total Jumps',
                    '=COUNTA(Logbook!A:A)-1',
                    '',
                    'Average Jumps/Month',
                    '=ROUND(COUNTA(Logbook!A:A)/(DATEDIF(MIN(Logbook!A:A), MAX(Logbook!A:A), "M")), 1)',
                    '',
                    'Unique Canopies Used'
                ],
                [
                    'Jumps This Year',
                    '=COUNTIFS(Logbook!A:A, ">="&DATE(YEAR(TODAY()),1,1))',
                    '',
                    'Most Active Month',
                    '=INDEX({1,2,3,4,5,6,7,8,9,10,11,12}, 1, MODE(MONTH(Logbook!A:A)))',
                    '',
                    '=COUNTA(UNIQUE(Logbook!F:F))'
                ],
                [
                    'Last 30 Days',
                    '=COUNTIFS(Logbook!A:A, ">="&TODAY()-30)',
                    '',
                    'Days Since Last Jump',
                    '=TODAY()-MAX(Logbook!A:A)',
                    '',
                    'Current Canopy'
                ],
                [
                    'Currency Status',
                    '=IF(TODAY()-MAX(Logbook!A:A)>90,"NOT CURRENT","CURRENT")',
                    '',
                    'Jump Frequency',
                    '=IF(D5<31,"Active",IF(D5<91,"Semi-Active","Inactive"))',
                    '',
                    '=INDEX(Logbook!F:F,MATCH(MAX(Logbook!A:A),Logbook!A:A,0))'
                ],
                ['', '', '', '', '', '', ''],
                ['Dropzone Analysis', '', '', 'Jump Type Analysis'],
                [
                    'Most Visited DZ',
                    '=INDEX(Logbook!B:B,MODE(MATCH(Logbook!B:B,Logbook!B:B,0)))',
                    '',
                    'Most Common Type',
                    '=INDEX(Logbook!E:E,MODE(MATCH(Logbook!E:E,Logbook!E:E,0)))'
                ],
                [
                    'Jumps at Home DZ',
                    '=COUNTIF(Logbook!B:B,B8)',
                    '',
                    'Recent Focus',
                    '=INDEX(Logbook!E:E,MATCH(MAX(Logbook!A:A),Logbook!A:A,0))'
                ],
                ['', '', '', '', '', '', ''],
                ['Recent Activity Log'],
                [
                    '=QUERY(Logbook!A:G, "SELECT A,B,E,F WHERE A IS NOT NULL ORDER BY A DESC LIMIT 5")'
                ]
            ];

            // Update the sheet with all formulas
            await this.sheets.spreadsheets.values.update({
                spreadsheetId,
                range: 'Analytics!A1:G15',
                valueInputOption: 'USER_ENTERED',
                resource: { values: formulas }
            });

            // Add conditional formatting for currency status
            await this.addConditionalFormatting(spreadsheetId);

            console.log('Analytics sheet setup complete!');
            return true;
        } catch (error) {
            console.error('Error setting up analytics:', error);
            return false;
        }
    }

    async createAnalyticsSheet(spreadsheetId) {
        try {
            await this.sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                resource: {
                    requests: [{
                        addSheet: {
                            properties: {
                                title: 'Analytics',
                                gridProperties: {
                                    rowCount: 1000,
                                    columnCount: 26
                                }
                            }
                        }
                    }]
                }
            });
        } catch (error) {
            // Sheet might already exist
            console.log('Analytics sheet may already exist, continuing...');
        }
    }

    async addConditionalFormatting(spreadsheetId) {
        const analyticsSheetId = await this.getSheetId(spreadsheetId, 'Analytics');
        
        const requests = [{
            addConditionalFormatRule: {
                rule: {
                    ranges: [{
                        sheetId: analyticsSheetId,
                        startRowIndex: 3,
                        endRowIndex: 4,
                        startColumnIndex: 1,
                        endColumnIndex: 2
                    }],
                    booleanRule: {
                        condition: {
                            type: 'TEXT_EQ',
                            values: [{ userEnteredValue: 'NOT CURRENT' }]
                        },
                        format: {
                            backgroundColor: { red: 1, green: 0.8, blue: 0.8 },
                            textFormat: { bold: true }
                        }
                    }
                }
            }
        }];

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            resource: { requests }
        });
    }

    async getSheetId(spreadsheetId, sheetName) {
        const response = await this.sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties'
        });

        const sheet = response.data.sheets.find(s => 
            s.properties.title === sheetName
        );

        return sheet ? sheet.properties.sheetId : null;
    }
}

async function main() {
    const auth = new google.auth.GoogleAuth({
        keyFile: './credentials.json',
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const analytics = new SkydiveAnalyticsSetup(await auth.getClient());
    const SPREADSHEET_ID = '1zDM0rkzke54iwCCN-cBzJpCPh38uTLOv2xo3Nktou-0';
    
    await analytics.setupAnalyticsSheet(SPREADSHEET_ID);
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = SkydiveAnalyticsSetup;