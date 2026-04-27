const axios = require('axios');
const sequelize = require('./config/sequelize');
const Profile = require('./models/profile');

const DRIVE_URL = 'https://drive.google.com/uc?export=download&id=1Up06dcS9OfUEnDj_u6OV_xTRntupFhPH';

async function seed() {
    try {
        // 1. Connection Check
        await sequelize.authenticate();
        console.log('--- Connected to Database ---');

        // 2. Fetch Data
        console.log('Fetching profiles from Google Drive...');
        const response = await axios.get(DRIVE_URL);
        
        let profiles = response.data;

        // 3. Robust Data Check (In case it's nested)
        if (!Array.isArray(profiles)) {
            profiles = profiles.data || profiles.profiles || [];
        }

        console.log(`Successfully retrieved ${profiles.length} records.`);

        // 4. Sync Schema
        // 'alter: true' ensures columns exist without dropping data first
        await sequelize.sync({ alter: true });

        // 5. High-Speed Injection
        console.log('Starting bulk insert... this may take a moment.');
        
        // Using chunks of 5000 to prevent memory overflow if the file is massive
        const chunkSize = 5000;
        for (let i = 0; i < profiles.length; i += chunkSize) {
            const chunk = profiles.slice(i, i + chunkSize);
            await Profile.bulkCreate(chunk, { 
                ignoreDuplicates: true, 
                validate: false 
            });
            console.log(`Inserted ${Math.min(i + chunkSize, profiles.length)} / ${profiles.length}`);
        }

        console.log('✅ Seeding complete!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Seeding failed:', error.message);
        if (error.message.includes('403') || error.message.includes('404')) {
            console.error('Tip: Make sure the Google Drive file is shared with "Anyone with the link".');
        }
        process.exit(1);
    }
}

seed();