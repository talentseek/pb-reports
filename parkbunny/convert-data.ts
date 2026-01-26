
import path from 'path'
import * as xlsx from 'xlsx'
import fs from 'fs'

async function extract() {
    const filePath = path.join(process.cwd(), 'public', 'lockers.xlsx')
    console.log('Reading:', filePath)

    const workbook = xlsx.readFile(filePath)
    const sheetName = workbook.SheetNames[0]
    const sheet = workbook.Sheets[sheetName]

    // Header at row 5 (0-indexed)
    const rawData = xlsx.utils.sheet_to_json<any>(sheet, { range: 5 })

    const cleanData = rawData
        .filter(row => row['Postcode'] || row['Site: Site Name'])
        .map((row, index) => ({
            id: `site-${index}`,
            name: row['Site: Site Name'] || `Site ${index}`,
            address: row['Address Line 1'] || '',
            city: row['City/Town'] || '',
            postcode: row['Postcode']?.toString().toUpperCase().trim() || '',
            spaces: Number(row['Number Of Spaces']) || 0
        }))

    const outputPath = path.join(process.cwd(), 'src/lib/lockers-data.json')
    fs.writeFileSync(outputPath, JSON.stringify(cleanData, null, 2))
    console.log(`Wrote ${cleanData.length} records to ${outputPath}`)
}

extract()
