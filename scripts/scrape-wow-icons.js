const https = require('https');
const fs = require('fs');

const baseUrl = 'https://wow.zamimg.com/images/wow/icons/large';
const workingIcons = [];

// Common WoW icon patterns to test
const iconPatterns = [
    // Spell icons
    'spell_fire_fireball', 'spell_frost_frostbolt', 'spell_nature_lightning',
    'spell_holy_heal', 'spell_shadow_shadowbolt', 'spell_arcane_arcane01',
    'spell_nature_healingtouch', 'spell_holy_powerwordbarrier', 'spell_shadow_metamorphosis',
    'spell_fire_flamebolt', 'spell_frost_iceclaw', 'spell_nature_stormreach',
    'spell_holy_powerwordshield', 'spell_shadow_curse', 'spell_arcane_teleport',
    'spell_nature_swiftness', 'spell_holy_divineprotection', 'spell_shadow_antishadow',
    'spell_fire_immolation', 'spell_frost_frostarmor', 'spell_nature_earthbind',
    'spell_holy_holybolt', 'spell_shadow_psychicscream', 'spell_arcane_manashield',
    'spell_nature_earthshock', 'spell_holy_heal02', 'spell_shadow_shadowwordpain',
    'spell_fire_fireblast', 'spell_frost_chillingblast', 'spell_nature_lightningbolt',
    'spell_holy_healingaura', 'spell_shadow_blackplague', 'spell_arcane_arcane02',
    'spell_nature_cyclone', 'spell_holy_power', 'spell_shadow_ritualofsacrifice',
    'spell_fire_incinerate', 'spell_frost_freezingbreath', 'spell_nature_earthquake',
    'spell_holy_heal01', 'spell_shadow_soulleech', 'spell_arcane_arcane03',
    'spell_nature_forceofnature', 'spell_holy_powerwordfortitude', 'spell_shadow_unholyfrenzy',
    'spell_fire_sealoffire', 'spell_frost_glacier', 'spell_nature_insectswarm',
    'spell_holy_healingfocus', 'spell_shadow_voidbolt', 'spell_arcane_arcane04',
    'spell_nature_natureblessing', 'spell_holy_powerinfusion', 'spell_shadow_haunting',
    'spell_fire_volcano', 'spell_frost_iceblock', 'spell_nature_natureswrath',
    'spell_holy_holyprotection', 'spell_shadow_nethercloak', 'spell_arcane_arcane05',
    'spell_nature_natureguardian', 'spell_holy_powerwordbarrier', 'spell_shadow_psychichorrors',
    'spell_fire_burnout', 'spell_frost_windwalkon', 'spell_nature_naturetouch',
    'spell_holy_holybolt', 'spell_shadow_ritualofsouls', 'spell_arcane_arcane06',
    'spell_nature_natureblessing', 'spell_holy_powerwordbarrier', 'spell_shadow_shadowfiend',

    // Item icons
    'inv_112_raidtrinkets_socketlegendarycloak_empowered_purple',
    'inv_sword_04', 'inv_mace_01', 'inv_axe_01', 'inv_staff_01', 'inv_wand_01',
    'inv_bow_01', 'inv_shield_01', 'inv_helmet_01', 'inv_chest_plate_01',
    'inv_boots_01', 'inv_glove_01', 'inv_ring_01', 'inv_jewelry_ring_01',
    'inv_potion_01', 'inv_food_01', 'inv_drink_01', 'inv_scroll_01',
    'inv_book_01', 'inv_gem_01', 'inv_ore_01', 'inv_herb_01',
    'inv_mount_01', 'inv_pet_01', 'inv_toy_01', 'inv_achievement_01',
    'inv_quest_01', 'inv_spell_01', 'inv_ability_01', 'inv_weapon_01',
    'inv_armor_01', 'inv_accessory_01', 'inv_consumable_01', 'inv_misc_01',
    'inv_eng_01', 'inv_ench_01', 'inv_jewel_01', 'inv_inscription_01',
    'inv_alchemy_01', 'inv_cooking_01', 'inv_firstaid_01', 'inv_tailoring_01',
    'inv_leatherworking_01', 'inv_blacksmithing_01', 'inv_engineering_01', 'inv_mining_01',
    'inv_herbalism_01', 'inv_skinning_01', 'inv_fishing_01', 'inv_archaeology_01',

    // Misc icons
    'inv_misc_questionmark', 'inv_misc_coin_01', 'inv_misc_coin_02', 'inv_misc_coin_03',
    'inv_misc_coin_04', 'inv_misc_coin_05', 'inv_misc_coin_06', 'inv_misc_coin_07',
    'inv_misc_coin_08', 'inv_misc_coin_09', 'inv_misc_coin_10', 'inv_misc_coin_11',
    'inv_misc_coin_12', 'inv_misc_coin_13', 'inv_misc_coin_14', 'inv_misc_coin_15',
    'inv_misc_coin_16', 'inv_misc_coin_17', 'inv_misc_coin_18', 'inv_misc_coin_19',
    'inv_misc_coin_20', 'inv_misc_coin_21', 'inv_misc_coin_22', 'inv_misc_coin_23',
    'inv_misc_coin_24', 'inv_misc_coin_25', 'inv_misc_coin_26', 'inv_misc_coin_27',
    'inv_misc_coin_28', 'inv_misc_coin_29', 'inv_misc_coin_30', 'inv_misc_coin_31',
    'inv_misc_coin_32', 'inv_misc_coin_33', 'inv_misc_coin_34', 'inv_misc_coin_35',
    'inv_misc_coin_36', 'inv_misc_coin_37', 'inv_misc_coin_38', 'inv_misc_coin_39',
    'inv_misc_coin_40', 'inv_misc_coin_41', 'inv_misc_coin_42', 'inv_misc_coin_43',
    'inv_misc_coin_44', 'inv_misc_coin_45', 'inv_misc_coin_46', 'inv_misc_coin_47',
    'inv_misc_coin_48', 'inv_misc_coin_49', 'inv_misc_coin_50'
];

function testIcon(iconId) {
    return new Promise((resolve) => {
        const url = `${baseUrl}/${iconId}.jpg`;
        const req = https.request(url, { method: 'HEAD' }, (res) => {
            if (res.statusCode === 200) {
                workingIcons.push({
                    id: `wow_icon_${workingIcons.length + 1}`,
                    name: formatIconName(iconId),
                    url: url,
                    keywords: generateKeywords(iconId)
                });
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

        req.setTimeout(5000, () => {
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
        .replace(/\b(spell|inv|misc)\b/g, (match) => {
            const map = { 'spell': 'Spell', 'inv': 'Item', 'misc': 'Misc' };
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
    }

    return [...new Set(keywords)]; // Remove duplicates
}

async function scrapeIcons() {
    console.log('🔍 Starting WoW icon discovery...');
    console.log(`Testing ${iconPatterns.length} icon patterns...`);

    for (let i = 0; i < iconPatterns.length; i++) {
        const iconId = iconPatterns[i];
        await testIcon(iconId);

        // Add small delay to avoid overwhelming the server
        if (i % 10 === 0) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    console.log(`\n✅ Found ${workingIcons.length} working icons!`);

    // Save to JSON file
    const output = {
        metadata: {
            totalIcons: workingIcons.length,
            baseUrl: baseUrl,
            scrapedAt: new Date().toISOString(),
            source: 'wow.zamimg.com'
        },
        icons: workingIcons
    };

    fs.writeFileSync('wow-icons.json', JSON.stringify(output, null, 2));
    console.log('💾 Saved to wow-icons.json');

    return workingIcons;
}

// Run the scraper
scrapeIcons().catch(console.error);
