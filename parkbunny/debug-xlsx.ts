
import path from 'path'
import * as xlsx from 'xlsx'

async function test() {
    console.log('CWD:', process.cwd())
    const filePath = path.join(process.cwd(), 'public', 'lockers.xlsx')
    console.log('Reading:', filePath)

    try {
        const workbook = xlsx.readFile(filePath)
        const sheetName = workbook.SheetNames[0]
        const sheet = workbook.Sheets[sheetName]
        console.log('Sheet Name:', sheetName)

        // Check Raw JSON
        const raw = xlsx.utils.sheet_to_json(sheet, { range: 5, header: 0 }) as any[]
        // header:0 implies mapping A,B,C... logic arrays? 
        // No, let's use default (first row is header)
        const jsonData = xlsx.utils.sheet_to_json(sheet, { range: 5 }) as any[]

        console.log('Row Count:', jsonData.length)
        if (jsonData.length > 0) {
            console.log('First Row Keys:', Object.keys(jsonData[0]))
            console.log('First Row:', jsonData[0])
        }
    } catch (e) {
        console.error('Error:', e)
    }
}

test()
