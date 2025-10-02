const https = require('https');
const fs = require('fs');

const baseUrl = 'https://wow.zamimg.com/images/wow/icons/large';
const workingIcons = [];
const testedUrls = new Set();

// Load existing icons to avoid duplicates
try {
    const existing = JSON.parse(fs.readFileSync('wow-icons.json', 'utf8'));
    existing.icons.forEach(icon => {
        workingIcons.push(icon);
        testedUrls.add(icon.url);
    });
    console.log(`📁 Loaded ${workingIcons.length} existing icons`);
} catch (err) {
    console.log('📁 No existing icons file found, starting fresh');
}

function testIcon(iconId) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/${iconId}.jpg`;

        if (testedUrls.has(url)) {
            resolve();
            return;
        }

        testedUrls.add(url);

        const req = https.request(url, { method: 'HEAD' }, (res) => {
            if (res.statusCode === 200) {
                const icon = {
                    id: `wow_icon_${workingIcons.length + 1}`,
                    name: formatIconName(iconId),
                    url: url,
                    keywords: generateKeywords(iconId)
                };
                workingIcons.push(icon);
                console.log(`✅ Found: ${iconId}`);
            } else {
                console.log(`❌ Not found: ${iconId}`);
            }
            resolve();
        });

        req.on('error', (err) => {
            console.log(`❌ Error testing ${iconId}: ${err.message}`);
            resolve();
        });

        req.setTimeout(3000, () => {
            console.log(`⏰ Timeout testing ${iconId}`);
            req.destroy();
            resolve();
        });

        req.end();
    });
}

function formatIconName(iconId) {
    return iconId
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/\b(spell|inv|misc|ability|trade)\b/g, (match) => {
            const map = {
                'spell': 'Spell',
                'inv': 'Item',
                'misc': 'Misc',
                'ability': 'Ability',
                'trade': 'Trade'
            };
            return map[match] || match;
        });
}

function generateKeywords(iconId) {
    const keywords = [];
    const parts = iconId.split('_');

    parts.forEach(part => {
        if (part.length > 2) {
            keywords.push(part);
        }
    });

    // Add category keywords
    if (iconId.startsWith('spell_')) {
        keywords.push('spell', 'ability');
        const school = parts[1];
        if (school) keywords.push(school);
    } else if (iconId.startsWith('inv_')) {
        keywords.push('item', 'inventory');
        const type = parts[1];
        if (type) keywords.push(type);
    } else if (iconId.startsWith('ability_')) {
        keywords.push('ability', 'class');
    } else if (iconId.startsWith('trade_')) {
        keywords.push('profession', 'trade');
    }

    return [...new Set(keywords)]; // Remove duplicates
}

async function generateIconPatterns() {
    const patterns = [];

    // Spell patterns - more comprehensive
    const spellSchools = ['fire', 'frost', 'nature', 'holy', 'shadow', 'arcane'];
    const spellTypes = [
        'fireball', 'frostbolt', 'lightning', 'heal', 'shadowbolt', 'arcane01',
        'flamebolt', 'iceclaw', 'stormreach', 'powerwordbarrier', 'metamorphosis',
        'powerwordshield', 'curse', 'teleport', 'swiftness', 'divineprotection',
        'antishadow', 'immolation', 'frostarmor', 'earthbind', 'holybolt',
        'psychicscream', 'manashield', 'earthshock', 'heal02', 'shadowwordpain',
        'fireblast', 'chillingblast', 'lightningbolt', 'healingaura', 'blackplague',
        'arcane02', 'cyclone', 'power', 'ritualofsacrifice', 'incinerate',
        'freezingbreath', 'earthquake', 'heal01', 'soulleech', 'arcane03',
        'forceofnature', 'powerwordfortitude', 'unholyfrenzy', 'sealoffire',
        'glacier', 'insectswarm', 'healingfocus', 'voidbolt', 'arcane04',
        'natureblessing', 'powerinfusion', 'haunting', 'volcano', 'iceblock',
        'natureswrath', 'holyprotection', 'nethercloak', 'arcane05',
        'natureguardian', 'psychichorrors', 'burnout', 'windwalkon',
        'naturetouch', 'ritualofsouls', 'arcane06', 'shadowfiend'
    ];

    spellSchools.forEach(school => {
        spellTypes.forEach(type => {
            patterns.push(`spell_${school}_${type}`);
        });
    });

    // Item patterns - more comprehensive
    const itemTypes = [
        'sword', 'mace', 'axe', 'staff', 'wand', 'bow', 'shield', 'helmet',
        'chest', 'boots', 'glove', 'ring', 'potion', 'food', 'drink', 'scroll',
        'book', 'gem', 'ore', 'herb', 'mount', 'pet', 'toy', 'achievement',
        'quest', 'spell', 'ability', 'weapon', 'armor', 'accessory', 'consumable',
        'misc', 'eng', 'ench', 'jewel', 'inscription', 'alchemy', 'cooking',
        'firstaid', 'tailoring', 'leatherworking', 'blacksmithing', 'engineering',
        'mining', 'herbalism', 'skinning', 'fishing', 'archaeology'
    ];

    // Test different number patterns
    for (let i = 1; i <= 50; i++) {
        itemTypes.forEach(type => {
            patterns.push(`inv_${type}_${i.toString().padStart(2, '0')}`);
        });
    }

    // Coin patterns
    for (let i = 1; i <= 100; i++) {
        patterns.push(`inv_misc_coin_${i.toString().padStart(2, '0')}`);
    }

    // Ability patterns
    const classes = ['deathknight', 'demonhunter', 'druid', 'evoker', 'hunter', 'mage', 'monk', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'];
    classes.forEach(className => {
        for (let i = 1; i <= 20; i++) {
            patterns.push(`ability_${className}_${i.toString().padStart(2, '0')}`);
        }
    });

    // Trade patterns
    const trades = ['alchemy', 'blacksmithing', 'cooking', 'engineering', 'firstaid', 'leatherworking', 'tailoring', 'mining', 'herbalism', 'skinning', 'fishing', 'archaeology', 'inscription', 'jewelcrafting'];
    trades.forEach(trade => {
        for (let i = 1; i <= 20; i++) {
            patterns.push(`trade_${trade}_${i.toString().padStart(2, '0')}`);
        }
    });

    // Common misc patterns
    const miscItems = ['questionmark', 'coin', 'bag', 'key', 'lock', 'unlock', 'map', 'compass', 'clock', 'calendar', 'book', 'scroll', 'parchment', 'letter', 'envelope', 'package', 'box', 'crate', 'chest', 'barrel', 'bottle', 'flask', 'vial', 'potion', 'elixir', 'oil', 'powder', 'dust', 'crystal', 'gem', 'stone', 'rock', 'ore', 'ingot', 'bar', 'plate', 'sheet', 'cloth', 'leather', 'hide', 'fur', 'feather', 'bone', 'skull', 'eye', 'heart', 'brain', 'liver', 'kidney', 'lung', 'stomach', 'intestine', 'blood', 'venom', 'poison', 'acid', 'fire', 'water', 'earth', 'air', 'spirit', 'soul', 'mind', 'body', 'heart', 'spirit', 'soul', 'mind', 'body'];

    miscItems.forEach(item => {
        patterns.push(`inv_misc_${item}`);
        for (let i = 1; i <= 10; i++) {
            patterns.push(`inv_misc_${item}_${i.toString().padStart(2, '0')}`);
        }
    });

    return patterns;
}

async function scrapeIcons() {
    console.log('🔍 Starting comprehensive WoW icon discovery...');

    const patterns = await generateIconPatterns();
    console.log(`📋 Generated ${patterns.length} icon patterns to test`);

    let tested = 0;
    const batchSize = 10;

    for (let i = 0; i < patterns.length; i += batchSize) {
        const batch = patterns.slice(i, i + batchSize);

        console.log(`\n🔄 Testing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(patterns.length / batchSize)} (${workingIcons.length} found so far)`);

        await Promise.all(batch.map(iconId => testIcon(iconId)));

        tested += batch.length;

        // Add delay between batches to avoid overwhelming the server
        if (i + batchSize < patterns.length) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    console.log(`\n✅ Discovery complete!`);
    console.log(`📊 Tested ${tested} patterns`);
    console.log(`🎯 Found ${workingIcons.length} working icons!`);

    // Save to JSON file
    const output = {
        metadata: {
            totalIcons: workingIcons.length,
            totalTested: tested,
            baseUrl: baseUrl,
            scrapedAt: new Date().toISOString(),
            source: 'wow.zamimg.com'
        },
        icons: workingIcons
    };

    fs.writeFileSync('wow-icons-comprehensive.json', JSON.stringify(output, null, 2));
    console.log('💾 Saved to wow-icons-comprehensive.json');

    return workingIcons;
}

// Run the comprehensive scraper
scrapeIcons().catch(console.error);
