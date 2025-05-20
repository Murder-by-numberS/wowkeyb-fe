export const classes = [
    {
        name: 'Death Knight',
        icon: 'assets/images/classes/death-knight.png'
    },
    {
        name: 'Demon Hunter',
        icon: 'assets/images/classes/demon-hunter.png'
    },
    {
        name: 'Druid',
        icon: 'assets/images/classes/druid.png'
    },
    {
        name: 'Evoker',
        icon: 'assets/images/classes/evoker.png'
    },
    {
        name: 'Hunter',
        icon: 'assets/images/classes/hunter.png'
    },
    {
        name: 'Mage',
        icon: 'assets/images/classes/mage.png'
    },
    {
        name: 'Monk',
        icon: 'assets/images/classes/monk.png'
    },
    {
        name: 'Paladin',
        icon: 'assets/images/classes/paladin.png'
    },
    {
        name: 'Priest',
        icon: 'assets/images/classes/priest.png'
    },
    {
        name: 'Rogue',
        icon: 'assets/images/classes/rogue.png'
    },
    {
        name: 'Shaman',
        icon: 'assets/images/classes/shaman.png'
    },
    {
        name: 'Warlock',
        icon: 'assets/images/classes/warlock.png'
    },
    {
        name: 'Warrior',
        icon: 'assets/images/classes/warrior.png'
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
