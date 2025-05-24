export const classes = [
    {
        name: 'Death Knight',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg'
    },
    {
        name: 'Demon Hunter',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg'
    },
    {
        name: 'Druid',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg'
    },
    {
        name: 'Evoker',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg'
    },
    {
        name: 'Hunter',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg'
    },
    {
        name: 'Mage',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg'
    },
    {
        name: 'Monk',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg'
    },
    {
        name: 'Paladin',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg'
    },
    {
        name: 'Priest',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg'
    },
    {
        name: 'Rogue',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg'
    },
    {
        name: 'Shaman',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg'
    },
    {
        name: 'Warlock',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg'
    },
    {
        name: 'Warrior',
        icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg'
    }
]

export const classNames = [
    'Death Knight',
    'Demon Hunter',
    'Druid',
    'Evoker',
    'Hunter',
    'Mage',
    'Monk',
    'Paladin',
    'Priest',
    'Rogue',
    'Shaman',
    'Warlock',
    'Warrior'
]

export const fullClasses = {
    'Death Knight': {
        specs: {
            Blood: ['Deathbringer', 'San\'layn'],
            Frost: ['Deathbringer', 'Rider of the Apocalypse'],
            Unholy: ['Rider of the Apocalypse', 'San\'layn']
        }
    },
    'Demon Hunter': {
        specs: {
            Havoc: ['Aldrachi Reaver', 'Fel-Scarred'],
            Vengeance: ['Aldrachi Reaver', 'Fel-Scarred'],
        }
    },
    'Druid': {
        specs: {
            Balance: ['Elune\'s Chosen', 'Keeper of the Grove'],
            Feral: ['Druid of the Claw', 'Wildstalker'],
            Guardian: ['Druid of the Claw', 'Elune\'s Chosen'],
            Restoration: ['Keeper of the Grove', 'Wildstalker']
        }
    },
    'Evoker': {
        specs: {
            Devastation: ['Flameshaper', 'Scalecommander'],
            Preservation: ['Chronowarden', 'Flameshaper'],
            Augmentation: ['Chronowarden', 'Scalecommander']
        }
    },
    'Hunter': {
        specs: {
            "Beast Mastery": ['Dark Ranger', 'Pack Leader'],
            Marksmanship: ['Dark Ranger', 'Sentinel'],
            Survival: ['Pack Leader', 'Sentinel']
        }
    },
    'Mage': {
        specs: {
            Arcane: ['Spellslinger', 'Sunfury'],
            Fire: ['Frostfire', 'Sunfury'],
            Frost: ['Frostfire', 'Spellslinger']
        }
    },
    'Monk': {
        specs: {
            Brewmaster: ['Master of Harmony', 'Shado-Pan'],
            Mistweaver: ['Conduit of the Celestials', 'Master of Harmony'],
            Windwalker: ['Conduit of the Celestials', 'Shado-Pan']
        }
    },
    'Paladin': {
        specs: {
            Holy: ['Herald of the Sun', 'Lightsmith'],
            Protection: ['Lightsmith', 'Templar'],
            Retribution: ['Herald of the Sun', 'Templar']
        }
    },
    'Priest': {
        specs: {
            Discipline: ['Oracle', 'Voidweaver'],
            Holy: ['Archon', 'Oracle'],
            Shadow: ['Archon', 'Voidweaver']
        }
    },
    'Rogue': {
        specs: {
            Assassination: ['Deathstalker', 'Fatebound'],
            Outlaw: ['Fatebound', 'Trickster'],
            Subtlety: ['Deathstalker', 'Trickster']
        }
    },
    'Shaman': {
        specs: {
            Elemental: ['Farseer', 'Stormbringer'],
            Enhancement: ['Stormbringer', 'Totemic'],
            Restoration: ['Farseer', 'Totemic']
        }
    },
    'Warlock': {
        specs: {
            Affliction: ['Hellcaller', 'Soul Harvester'],
            Demonology: ['Diabolist', 'Soul Harvester'],
            Destruction: ['Diabolist', 'Hellcaller']
        }
    },
    'Warrior': {
        specs: {
            Arms: ['Colossus', 'Slayer'],
            Fury: ['Mountain Thane', 'Slayer'],
            Protection: ['Colossus', 'Mountain Thane']
        }
    }
}
