const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const { plot } = require('nodeplotlib');

const app = express();
const upload = multer({ dest: './uploads/' });

app.post('/calculate_portfolio', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', () => { 
            const portfolioValues = [];
            results.forEach((row) => {
                
               row.top_10 = JSON.parse(row.top_10.replace(/'/g, '"'));
               row.percent_change_values = JSON.parse(row.percent_change_values);
                
                let slotValues = [100]; 
                
                row.top_10.forEach((stock, i) => {
                   slotValues.push(slotValues[i] * (1 + row.percent_change_values[i] / 100));
                });
                portfolioValues.push(slotValues.reduce((a, b) => a + b, 0));
            });
            const x = results.map((row) => row.datetime);
            plot([
                {
                    x: x,
                    y: portfolioValues,
                    type: 'line',
                    marker: { color: 'green' },
                },
            ], {
                title: 'Portfolio Value Over Time',
                xaxis: { title: 'Datetime' },
                yaxis: { title: 'Portfolio Value' },
                width: 1200,
                height: 600,
            });
            
            res.json({ portfolioValues });
        });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
