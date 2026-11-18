const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));

let vehicleDb = {};
try { vehicleDb = JSON.parse(fs.readFileSync('vehicles.json', 'utf8')); } catch (e) {}

let lineDb = {};
try { lineDb = JSON.parse(fs.readFileSync('linky.json', 'utf8')); } catch (e) {}

app.get('/api/vehicles', async (req, res) => {
    try {
        const response = await axios.get('https://www.stops.lt/vilnius/gps.txt', { timeout: 15000 });
        const rawText = response.data;
        const mapData = [];
        const lines = typeof rawText === 'string' ? rawText.split('\n') : [];
        
        lines.forEach(line => {
            const cols = line.trim().split(',');
            if (cols.length < 6) return; 

            const typTrakce = cols[0]; 
            const linka = cols[1];
            const lngRaw = parseInt(cols[2], 10);
            const latRaw = parseInt(cols[3], 10);
            const vehicleId = cols[6] || cols[4]; 

            if (!latRaw || !lngRaw || !vehicleId) return;

            const lat = latRaw / 1000000;
            const lng = lngRaw / 1000000;
            
            let vychoziTrakce = "Autobus";
            if (typTrakce === '2') vychoziTrakce = "Trolejbus";

            const dbInfo = vehicleDb[vehicleId] || { typ: "Neznámý", trakce: vychoziTrakce, rok: "Neznámý" };
            const trasaLinky = lineDb[linka] || "Neznámá trasa";

            mapData.push({ 
                id: vehicleId, lat, lng, linka, rychlost: 0, 
                typ: dbInfo.typ, trakce: dbInfo.trakce, rok: dbInfo.rok,
                trasa: trasaLinky
            });
        });
        res.json(mapData);
    } catch (error) {
        console.error("Chyba spojení s Vilniusem:", error.message);
        res.status(500).json({ error: "Nelze stáhnout data." });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend Vilnius běží na portu ${PORT}`);
});
