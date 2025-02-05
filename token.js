import fs from 'fs'

// Read a.json
fs.readFile('tokenwithDecimal.json', 'utf8', (err, data) => {
    if (err) {
        console.error('Error reading file:', err);
        return;
    }

    try {
        const jsonData = JSON.parse(data);

        // Extract "address" values
        const transformedData = jsonData.map(item => item.address);

        // Write to b.json
        fs.writeFile('token.json', JSON.stringify(transformedData), (err) => {
            if (err) {
                console.error('Error writing file:', err);
            } else {
                console.log('Transformation complete: a.json → b.json');
            }
        });

    } catch (error) {
        console.error('Error parsing JSON:', error);
    }
});