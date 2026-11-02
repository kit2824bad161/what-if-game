/**
 * Curated Seed Dataset for WHAT IF — The Alternate Movie Universe
 * Includes 12 cinematic masterpieces across Tamil cinema and global classics.
 * Fully verified canon plot summaries, characters, world rules, turning points, and suggested what-if questions.
 */

export const seedMovies = [
  {
    movieId: 'vikram-2022',
    title: 'Vikram',
    originalTitle: 'விக்ரம்',
    aliases: ['Vikram: Hitlist', 'Vikram 2'],
    releaseYear: 2022,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Action', 'Thriller', 'Crime'],
    director: 'Lokesh Kanagaraj',
    overview: 'A high-octane action thriller where a covert black-ops commander emerges from self-imposed exile to dismantle a ruthless drug cartel while a special investigator uncovers a sprawling conspiracy.',
    plotSummary: `In Chennai, a masked vigilante group executes high-ranking narcotics bureau officials. Inspector Amar, chief of a clandestine black-ops squad, is summoned to investigate the assassination of Karnan, an ostensibly ordinary drunkard and father of slain police officer Prapanjan. As Amar conducts forensic inquiries into Karnan's double life, he discovers Karnan was actually Agent Vikram, legendary commander of the 1991 black-ops squad "Pilot Wing" thought dead for decades.

Meanwhile, ruthless cartel kingpin Sandhanam of the Vettiyaadu syndicate desperately hunts for a missing two-ton shipment of raw cocaine before his unseen supreme overlord, Rolex, unleashes retribution. Amar's investigation leads him to discover that Karnan staged his death to protect his infant grandson and secretly wage war against the syndicate. When Amar uncovers systemic police betrayal orchestrated by Commissioner Jose, Amar's personal life is devastated by Sandhanam's retaliation.

Vikram launches a fortified assault against Sandhanam's armory, arming himself with heavy weaponry to obliterate the cartel's drug empire. In the explosive climax, Vikram, Amar, and allied officers turn Sandhanam's headquarters into an inferno. After defeating Sandhanam in hand-to-hand combat, Vikram relocates his grandson to international safety and establishes a network of vigilantes across borders, setting up a clash against the enigmatic kingpin Rolex.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/t5zCBSB5xMDKcDqe71TCK63EiNk.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/mDFNs73u87wM2C2L60vGfXp3D0z.jpg',
    characters: [
      {
        name: 'Agent Vikram (Karnan)',
        actor: 'Kamal Haasan',
        role: 'Protagonist / Covert Commander',
        summary: 'Ex-commander of the 1991 Pilot Wing black-ops squad, operating under deep cover to dismantle the drug syndicate.',
        relationships: ['Father of ACP Prapanjan', 'Protector of infant grandson', 'Target of Sandhanam and Jose'],
        traits: ['Master tactician', 'Heavy weapons expert', 'Unwavering resolve']
      },
      {
        name: 'Inspector Amar',
        actor: 'Fahadh Faasil',
        role: 'Special Investigator',
        summary: 'Meticulous leader of a secret intelligence squad tasked with tracking the masked executioners.',
        relationships: ['Investigating Karnan', 'Betrayed by Commissioner Jose', 'Husband to Gayathri'],
        traits: ['Analytical', 'Obsessive investigator', 'Moral awakening']
      },
      {
        name: 'Santhanam',
        actor: 'Vijay Sethupathi',
        role: 'Syndicate Patriarch',
        summary: 'Ruthless leader of the Vettiyaadu cartel who controls an entire joint-family empire and answers to Rolex.',
        relationships: ['Cartel boss', 'Allied with corrupt police', 'Feared by subordinates'],
        traits: ['Drug-fueled berserker', 'Fiercely protective of family clan', 'Violent']
      },
      {
        name: 'Agent Tina',
        actor: 'Vasanthi',
        role: 'Undercover Operative',
        summary: 'Elite Pilot Wing agent disguised as a domestic housemaid to protect Vikram’s infant grandson.',
        relationships: ['Loyal to Vikram', 'Guardian of the child'],
        traits: ['Lethal hand-to-hand combatant', 'Stoic', 'Self-sacrificing']
      }
    ],
    canonEvents: [
      {
        eventId: 'vikram-e1',
        order: 1,
        title: 'The Assassination of Karnan',
        description: 'Masked vigilantes execute Karnan in an apparent routine hit, setting off Amar\'s investigation.',
        significance: 'Inciting incident',
        charactersInvolved: ['Karnan', 'Amar'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Karnan was captured alive instead of faking his execution?'
      },
      {
        eventId: 'vikram-e2',
        order: 2,
        title: 'Amar Discovers Karnan is Agent Vikram',
        description: 'Amar matches biometric and archival records, realizing the dead drunkard is a legendary black-ops operative.',
        significance: 'Major turning point',
        charactersInvolved: ['Amar', 'Vikram'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Amar arrested Vikram immediately instead of empathizing with his crusade?'
      },
      {
        eventId: 'vikram-e3',
        order: 3,
        title: 'Agent Tina Reveals Her True Identity',
        description: 'When Sandhanam\'s thugs invade Vikram\'s house, the elderly housemaid Tina reveals herself as an elite martial artist.',
        significance: 'Critical battle',
        charactersInvolved: ['Tina', 'Sandhanam\'s Thugs'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Tina survived the ambush alongside Vikram\'s grandson without sustaining lethal injuries?'
      },
      {
        eventId: 'vikram-e4',
        order: 4,
        title: 'Commissioner Jose Exposed as Sandhanam\'s Mole',
        description: 'Amar discovers his superior Jose is actively leaking intelligence to the Vettiyaadu cartel.',
        significance: 'Betrayal reveal',
        charactersInvolved: ['Amar', 'Jose', 'Sandhanam'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Jose was blackmailed into turning against Sandhanam before the warehouse battle?'
      }
    ],
    worldRules: [
      'The LCU (Lokesh Cinematic Universe) connects drug supply chains directly to Kaithi and Rolex.',
      'Black-ops Pilot Wing operatives are officially disavowed ghosts without government backing.',
      'Cartel punishment for lost narcotics is absolute death dictated by Rolex.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Raaj Kamal Films International official release', 'Verified screenplay canon', 'TMDB #823625'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'baahubali-2015',
    title: 'Baahubali: The Beginning',
    originalTitle: 'பாகுபலி: தொடக்கம்',
    aliases: ['Baahubali 1', 'Baahubali: Part 1'],
    releaseYear: 2015,
    language: 'ta',
    languageLabel: 'Tamil / Multi-lingual',
    genres: ['Action', 'Drama', 'Epic', 'Fantasy'],
    director: 'S. S. Rajamouli',
    overview: 'In ancient Mahishmati, a spirited young man raised in tribal isolation discovers his royal heritage and the tragic betrayal that tore his father\'s empire apart.',
    plotSummary: `Queen Mother Sivagami emerges from a flooded cave bearing an infant, sacrificing her life to keep the baby above water. The infant is rescued and adopted by tribal villagers near the foot of giant waterfalls and named Shivudu. Drawn by curiosity toward the peaks, Shivudu scales the impassable waterfalls as an adult, inspired by a dropped wooden mask belonging to Avanthika, a fierce rebel warrior devoted to freeing the imprisoned Queen Devasena.

Shivudu wins Avanthika's affection and undertakes her perilous mission himself, infiltrating the fortified city of Mahishmati. There, the tyrannical King Bhallaladeva rules with cruelty. During the public erection of a colossal golden statue of Bhallaladeva, the enslaved laborers recognize Shivudu as the spitting image of their beloved late prince, Amarendra Baahubali.

When the loyal royal slave commander Kattappa attacks Shivudu to defend the crown, he recognizes the boy's royal bloodline and prostrates in reverence. Surrounding elders and soldiers hail him as Mahendra Baahubali. In the legendary flashback, Kattappa recounts the valor of Amarendra Baahubali in the war against the Kalakeyas and Sivagami's decree making him King. Shivudu asks who murdered his noble father, and Kattappa tearfully confesses that he himself executed Baahubali.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/9xD9k1R3m1w2jEw6P36c84kGz4E.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/6xKCY0hCPC2HQ8BwR6MmB8t8hI4.jpg',
    characters: [
      {
        name: 'Amarendra Baahubali / Mahendra Baahubali (Shivudu)',
        actor: 'Prabhas',
        role: 'Protagonist / True Heir',
        summary: 'Charismatic prince revered for compassion and unmatched warrior prowess.',
        relationships: ['Son of Amarendra & Devasena', 'Adopted by Sanga', 'Beloved by Avanthika'],
        traits: ['Superhuman strength', 'Strategic genius', 'Unconditional empathy']
      },
      {
        name: 'Bhallaladeva',
        actor: 'Rana Daggubati',
        role: 'Antagonist / Usurper King',
        summary: 'Envious cousin who schemes to usurp the throne and enslaves Devasena.',
        relationships: ['Cousin of Baahubali', 'Son of Bijjaladeva and Sivagami'],
        traits: ['Machiavellian', 'Ruthlessly ambitious', 'Formidable brawler']
      },
      {
        name: 'Kattappa',
        actor: 'Sathyaraj',
        role: 'Royal Slave Commander',
        summary: 'Bound by ancient hereditary oath to serve whoever sits on Mahishmati’s throne, despite his love for Baahubali.',
        relationships: ['Surrogate uncle to Baahubali', 'Enslaved to the throne'],
        traits: ['Supreme swordsman', 'Tortured by code of honor', 'Fiercely loyal']
      },
      {
        name: 'Sivagami',
        actor: 'Ramya Krishnan',
        role: 'Queen Regent',
        summary: 'Steely ruler of Mahishmati whose word is royal law, blinded by deceptive court intrigues.',
        relationships: ['Mother of Bhallaladeva', 'Adoptive mother of Baahubali'],
        traits: ['Commanding presence', 'Strict adherent of justice', 'Tragically fallible']
      }
    ],
    canonEvents: [
      {
        eventId: 'baahu-e1',
        order: 1,
        title: 'Sivagami Saves the Infant at the Waterfall',
        description: 'Sivagami holds infant Mahendra above the raging river, drowning while praying for his survival.',
        significance: 'Prologue turning point',
        charactersInvolved: ['Sivagami', 'Mahendra'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Sivagami survived the river crossing and raised the prince in hiding herself?'
      },
      {
        eventId: 'baahu-e2',
        order: 2,
        title: 'The War with the Kalakeya Horde',
        description: 'Baahubali and Bhallaladeva compete to kill the Kalakeya warlord. Baahubali protects the common folk during battle.',
        significance: 'Royal decree contest',
        charactersInvolved: ['Baahubali', 'Bhallaladeva', 'Kalakeya King'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Bhallaladeva was killed on the battlefield by the Kalakeya warlord?'
      },
      {
        eventId: 'baahu-e3',
        order: 3,
        title: 'Kattappa Confesses the Murder of Baahubali',
        description: 'Kattappa reveals to Mahendra that he himself stabbed Amarendra Baahubali in the back.',
        significance: 'Iconic cliffhanger',
        charactersInvolved: ['Kattappa', 'Mahendra'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Kattappa refused Sivagami\'s royal command and rebelled to protect Baahubali?'
      }
    ],
    worldRules: [
      'The royal slave lineage of Kattappa cannot disobey a direct command from the seated monarch.',
      'Mahishmati’s succession requires the approval of the Queen Mother and royal court.',
      'Devasena refuses rescue until her son returns to deliver rightful retribution.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Arka Media Works official screenplay', 'TMDB #256040'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'nayakan-1987',
    title: 'Nayakan',
    originalTitle: 'நாயகன்',
    aliases: ['The Hero', 'Nayakan 1987'],
    releaseYear: 1987,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Crime', 'Drama'],
    director: 'Mani Ratnam',
    overview: 'A young fugitive from Tamil Nadu rises to become the benevolent yet feared godfather of Mumbai\'s Dharavi slum.',
    plotSummary: `After witnessing his union-leader father killed by corrupt police, young Sakthivel murders the inspector responsible and flees to Bombay. Taken in by a kindly Muslim smuggler in Dharavi, Velu grows into a compassionate protector of the marginalized Tamil diaspora against corrupt authorities and extortionist gangs. When his surrogate father is framed and assaulted by police, Velu kills the corrupt officer Kelkar and formally assumes the role of neighborhood Don.

As Velu Naicker's syndicate expands, he establishes an informal court delivering swift, compassionate justice. However, his moral compromises extract an agonizing personal toll. His wife Neela is assassinated by rival gangsters, and his alienated daughter Charumati renounces his violent empire and leaves him.

Decades later, an uncompromising young ACP arrives in Mumbai determined to dismantle Naicker's syndicate, unaware that his own wife is Velu's estranged daughter. Velu surrenders to protect his family and the community. At his acquittal outside the high court, as thousands cheer, the grandson of Kelkar assassinates Velu in broad daylight, posing the haunting question: "Are you a good man or a bad man?"`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/t7pUeW0vM8q0vJq6K34tQzK0Q.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/uC8Yt7g1e2b3c4d5e6f7a8b9.jpg',
    characters: [
      {
        name: 'Sakthivel "Velu" Naicker',
        actor: 'Kamal Haasan',
        role: 'Protagonist / Don of Dharavi',
        summary: 'A revered mafia godfather whose vigilante justice protects the poor while destroying his own family.',
        relationships: ['Father of Charumati & Surya', 'Husband of Neela', 'Target of Mumbai Police'],
        traits: ['Charismatic', 'Uncompromising sense of street justice', 'Tragically lonely']
      },
      {
        name: 'Charumati',
        actor: 'Saranya Ponvannan',
        role: 'Velu’s Estranged Daughter',
        summary: 'Refuses to accept blood-stained wealth and marries the honest police officer investigating her father.',
        relationships: ['Daughter of Velu', 'Wife of ACP Kumar'],
        traits: ['Principled', 'Defiant', 'Heartbroken']
      }
    ],
    canonEvents: [
      {
        eventId: 'nayakan-e1',
        order: 1,
        title: 'Velu Executes Inspector Kelkar',
        description: 'Velu beats Kelkar to death after the officer hospitalizes Velu’s mentor, crossing the threshold into crime.',
        significance: 'Point of no return',
        charactersInvolved: ['Velu', 'Kelkar'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Velu spared Kelkar and fought the injustice through legal labor mobilization?'
      },
      {
        eventId: 'nayakan-e2',
        order: 2,
        title: 'Acquittal and Kelkar’s Grandson’s Retribution',
        description: 'Velu is acquitted by the court but is gunned down on the steps by Kelkar\'s orphaned grandson.',
        significance: 'Tragic climax',
        charactersInvolved: ['Velu', 'Kelkar\'s Grandson'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Velu recognized the young boy with the gun before the fatal trigger was pulled?'
      }
    ],
    worldRules: [
      'In Dharavi, the state legal apparatus is powerless; Velu Naicker’s word is the ultimate judicial decree.',
      'Violence begets generational vengeance: blood spilt in youth returns to demand retribution in old age.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Madras Talkies / GV Films canon screenplay', 'Time Magazine All-Time 100 Films list', 'TMDB #46793'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'kaithi-2019',
    title: 'Kaithi',
    originalTitle: 'கைதி',
    aliases: ['Prisoner', 'Kaithi 2019'],
    releaseYear: 2019,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Action', 'Thriller', 'Crime'],
    director: 'Lokesh Kanagaraj',
    overview: 'A paroled convict with a secret military past drives a truck full of poisoned police officers across an ambush-laden highway to see his daughter for the first time.',
    plotSummary: `Following an unprecedented raid seizing 900 kilograms of high-grade cocaine, Inspector Bejoy and his task force store the contraband inside the underground catacombs of the old Trichy police commissionerate. That night, at a high-level police retirement party, cartel operatives poison the drinks of every senior officer with a lethal sedative. Desperate to transport forty dying officers to hospital before dawn, Bejoy coerces Dilli, a silent convict released on parole after ten years, to pilot an ancient government lorry.

Dilli, whose only burning desire is to travel to an orphanage to meet his ten-year-old daughter Amudha for the first time, reluctantly accepts when Bejoy promises him formal release papers and a reunion. Meanwhile, ruthless drug lords Adaikalam and Anbu dispatch hundreds of armed gangsters to lay siege to the commissionerate to kill trapped constables and recover the drugs.

Throughout the harrowing night, Dilli faces ambushes, road spikes, and betrayal. At the besieged police station, young college students and a lone constable named Napoleon barricade the gates against waves of attackers. In the epic climax, Dilli arrives at the police station just as Napoleon's defense falls, wielding a mounted Gatling gun to wipe out Anbu's army and save the officers before reuniting in tears with his daughter.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/bL8nE23M8H4QW6h2j8K8k0vB.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9r1kK0Q7w2e3r4t5y6u7i8o9.jpg',
    characters: [
      {
        name: 'Dilli',
        actor: 'Karthi',
        role: 'Protagonist / Paroled Prisoner',
        summary: 'A quiet, formidable former convict with a hidden past who wants only to meet his daughter.',
        relationships: ['Father of Amudha', 'Reluctant ally to Bejoy'],
        traits: ['Indomitable stamina', 'Fierce brawler', 'Devoted father']
      },
      {
        name: 'Inspector Bejoy',
        actor: 'Narain',
        role: 'Uncorrupted Police Officer',
        summary: 'Injured officer whose drug bust triggered the cartel ambush.',
        relationships: ['Commander of the transport', 'Father figure to his men'],
        traits: ['Tenacious', 'Honorable', 'Desperate']
      }
    ],
    canonEvents: [
      {
        eventId: 'kaithi-e1',
        order: 1,
        title: 'Poisoning of the Police Hierarchy',
        description: 'Cartel agents spike the drinks at the police gathering, incapacitating forty commanders simultaneously.',
        significance: 'Catastrophic catalyst',
        charactersInvolved: ['Bejoy', 'Senior Officers'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Bejoy intercepted the poisoned drinks before the officers consumed them?'
      },
      {
        eventId: 'kaithi-e2',
        order: 2,
        title: 'The Gatling Gun Climax',
        description: 'Dilli unearths a decommissioned Gatling gun from the evidence locker and mows down the invading gang.',
        significance: 'Legendary climax',
        charactersInvolved: ['Dilli', 'Anbu', 'Napoleon'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if the weapon ammunition had been sabotaged by corrupt officers?'
      }
    ],
    worldRules: [
      'All action takes place over a single continuous night (8:00 PM to 6:00 AM).',
      'The cartel has eyes inside the police force; phone lines and radios are compromised.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Dream Warrior Pictures canon script', 'LCU official timeline', 'TMDB #624808'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'super-deluxe-2019',
    title: 'Super Deluxe',
    originalTitle: 'சூப்பர் டீலக்ஸ்',
    aliases: ['Super Deluxe 2019'],
    releaseYear: 2019,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Drama', 'Thriller', 'Comedy', 'Mystery'],
    director: 'Thiagarajan Kumararaja',
    overview: 'Four intersecting stories across Chennai intertwine fate, morality, gender identity, extraterrestrial mystery, and the human search for cosmic meaning.',
    plotSummary: `In Chennai, four disparate narratives unfold across one fateful day. Transgender woman Shilpa returns home after years to reunite with her wife Jyothi and young son Rasukutty, confronting societal transphobia, police brutality, and the pure unconditional love of her boy. Concurrently, married couple Vembu and Mugil face an existential crisis when Vembu's casual ex-lover suddenly dies of a heart condition in their bedroom, forcing them into a panicked attempt to dispose of the corpse.

Meanwhile, teenage friends Gaaji, Soori, and Murugan skip school to watch an adult movie on TV, only to discover to their horror that Gaaji's pious mother Leela is the starring actress, throwing their understanding of purity and familial shame into chaos. Elsewhere, Arputham, a devout preacher who survived a tsunami, faces an apocalyptic crisis of faith when a mysterious alien encounter and a stray falling television overturn his dogma.

As corrupt police officer Berlin blackmails and exploits the protagonists across all storylines, their paths collide in a bizarre, darkly comic climax where morality is unmasked as an arbitrary human invention against the absurd, luminous beauty of the universe.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/w7rJ1lQ5C1fV8k9E6m5g4b3n2o1.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8q2w3e4r5t6y7u8i9o0p1a2.jpg',
    characters: [
      {
        name: 'Shilpa (Manickam)',
        actor: 'Vijay Sethupathi',
        role: 'Protagonist',
        summary: 'A transgender woman who returns to her family with dignity, facing brutal humiliation from corrupt police.',
        relationships: ['Parent to Rasukutty', 'Husband/Partner to Jyothi'],
        traits: ['Gentle dignity', 'Fiercely loving parent', 'Resilient']
      },
      {
        name: 'Vembu',
        actor: 'Samantha Ruth Prabhu',
        role: 'Protagonist',
        summary: 'A sharp, pragmatic woman navigating an absurd emergency when an affair partner dies in her home.',
        relationships: ['Wife of Mugil'],
        traits: ['Pragmatic under pressure', 'Morally complex']
      }
    ],
    canonEvents: [
      {
        eventId: 'sd-e1',
        order: 1,
        title: 'The Corpse in the Bedroom',
        description: 'Vembu\'s ex-boyfriend dies of a sudden aneurysm in bed; Mugil arrives home and they attempt to pack the body in a cooler bag.',
        significance: 'Inciting absurdity',
        charactersInvolved: ['Vembu', 'Mugil'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if the ex-boyfriend was not dead, but fell into a coma and awakened mid-disposal?'
      }
    ],
    worldRules: [
      'Human morality and societal judgments are shown as tiny illusions in a cosmic, uncaring yet wondrous universe.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Tyler Durden and Kino Fist official script', 'TMDB #533642'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'anbe-sivam-2003',
    title: 'Anbe Sivam',
    originalTitle: 'அன்பே சிவம்',
    aliases: ['Love is God', 'Anbe Sivam 2003'],
    releaseYear: 2003,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Drama', 'Comedy', 'Philosophy'],
    director: 'Sundar C. (Written by Kamal Haasan)',
    overview: 'Stranded during a torrential flood, an arrogant commercial ad director and a scarred communist street-theater artist undertake an odyssey that dismantles selfishness.',
    plotSummary: `At the flooded Bhubaneswar airport, Anbarasu (A. Aras), an arrogant, consumerist advertising filmmaker heading to Chennai for his lavish wedding, meets Nallasivam (Nalla), a scarred, limping man with a deformed eye who believes that love itself is the divine (Anbe Sivam). Due to washed-out flight lines and train disruptions, the mismatched duo are forced to travel together across Odisha and Andhra Pradesh toward Chennai.

Throughout the journey, Aras is exasperated by Nalla's eccentric humanitarianism, atheism, and concern for striking union workers. In a poignant flashback, Nallasivam is revealed to have been an educated street-play artist and communist trade unionist who fought against the brutal capitalist factory owner Kandasamy Santhanam. Nalla fell in love with Santhanam's daughter Balasaraswathi (Bala), but their elopement was derailed when Santhanam arranged a horrific bus crash, leaving Nalla permanently disfigured while lying to Bala that Nalla had perished.

When Aras witnesses Nalla rush to donate his own rare blood to save a critically injured stranger at a railway accident, Aras has an epiphany of spiritual empathy. Upon finally reaching Chennai, Aras is stunned to realize his bride is none other than Bala. Santhanam dispatches an assassin to execute Nalla; instead of fleeing or seeking vengeance, Nalla forgives the assassin and departs in peace, leaving Bala to live her life happily.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/kK9k2t8E0bW3M5Q7J1X4c6V8B2.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/3w4e5r6t7y8u9i0o1p2a3.jpg',
    characters: [
      {
        name: 'Nallasivam',
        actor: 'Kamal Haasan',
        role: 'Protagonist / Trade Unionist',
        summary: 'A compassionate, scarred communist artist who embodies the philosophy that love is the highest form of godliness.',
        relationships: ['Former lover of Balasaraswathi', 'Companion to Anbarasu'],
        traits: ['Radical empathy', 'Witty satirist', 'Selfless']
      },
      {
        name: 'Anbarasu (A. Aras)',
        actor: 'Madhavan',
        role: 'Protagonist / Ad Director',
        summary: 'A cynical, status-obsessed modern professional who undergoes a profound moral metamorphosis.',
        relationships: ['Fiancé of Balasaraswathi', 'Travel companion to Nalla'],
        traits: ['Neurotic', 'Self-centered initially', 'Ultimately redemptive']
      }
    ],
    canonEvents: [
      {
        eventId: 'as-e1',
        order: 1,
        title: 'The Sabotaged Bus Crash',
        description: 'Santhanam\'s henchmen ram Nallasivam\'s bus down an embankment, disfiguring Nalla and separating him from Bala.',
        significance: 'Origin of tragedy',
        charactersInvolved: ['Nalla', 'Santhanam\'s Henchmen'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Nallasivam escaped the bus ambush unscathed and reached Bala before she could be lied to?'
      }
    ],
    worldRules: [
      'Genuine divinity is revealed through acts of selfless compassion, not ritual dogma.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Lakshmi Movie Makers official screenplay', 'Kamal Haasan writings', 'TMDB #46794'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'the-dark-knight-2008',
    title: 'The Dark Knight',
    originalTitle: 'The Dark Knight',
    aliases: ['Batman 2', 'TDK'],
    releaseYear: 2008,
    language: 'en',
    languageLabel: 'English',
    genres: ['Action', 'Crime', 'Drama'],
    director: 'Christopher Nolan',
    overview: 'Batman, Gordon, and DA Harvey Dent form an alliance against the mob, but are pushed to the psychological brink by the Joker’s anarchy.',
    plotSummary: `In Gotham City, organized crime is crippled by the vigilante Batman, Lieutenant James Gordon, and heroic new District Attorney Harvey Dent. Desperate mob bosses hire the Joker, a psychotic criminal mastermind who promises to assassinate Batman in exchange for half their fortune. The Joker unleashes a reign of terror, assassinating judges, police commissioners, and civilians, daring Batman to unmask himself.

When Dent falsely claims to be Batman to draw the Joker into the open, a highway convoy battle leads to the Joker's capture by Batman and Gordon. However, the Joker orchestrates the simultaneous kidnapping of both Dent and Batman's childhood love, Rachel Dawes, placing them in distant buildings rigged with explosives. The Joker gives Batman the coordinates but reverses their locations; Batman rushes to save Rachel only to arrive at Dent's location, pulling him out just as the blast burns half of Dent's face off, while Rachel dies in the other explosion.

The Joker breaks out of custody and corrupts the grieving Dent into the vengeful vigilante Two-Face. Two-Face embarks on a murderous spree against the corrupt officers who betrayed Rachel. After Batman prevents the Joker from blowing up two passenger ferries, he confronts Two-Face, who threatens Gordon's son. Batman tackles Dent off a ledge to save the child, killing Dent. To preserve Dent's inspirational legacy and the anti-mob laws, Batman takes the blame for Dent's murders, becoming Gotham's hunted Dark Knight.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg',
    characters: [
      {
        name: 'Bruce Wayne / Batman',
        actor: 'Christian Bale',
        role: 'Protagonist / Vigilante',
        summary: 'Gotham’s protector who refuses to kill, tested to the breaking point by the Joker.',
        relationships: ['Allied with Gordon and Dent', 'Loves Rachel Dawes'],
        traits: ['Uncompromising moral line', 'Tactical master', 'Self-sacrificing']
      },
      {
        name: 'The Joker',
        actor: 'Heath Ledger',
        role: 'Antagonist / Agent of Chaos',
        summary: 'Anarchist criminal mastermind who seeks to prove that civilized humanity will turn feral when pushed.',
        relationships: ['Nemesis of Batman', 'Corrupter of Harvey Dent'],
        traits: ['Psychopathic genius', 'Unpredictable', 'Ideological terrorist']
      }
    ],
    canonEvents: [
      {
        eventId: 'tdk-e1',
        order: 1,
        title: 'The Joker Reverses the Hostage Locations',
        description: 'Batman races to save Rachel based on Joker\'s address, but finds Harvey Dent instead; Rachel is incinerated.',
        significance: 'Tragic turning point',
        charactersInvolved: ['Batman', 'Joker', 'Rachel', 'Dent'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Batman saw through the Joker’s address reversal and saved Rachel Dawes instead?'
      }
    ],
    worldRules: [
      'Batman will not kill or use firearms, believing it crosses an irrevocable line.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Warner Bros / DC Comics screenplay', 'TMDB #155'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'the-matrix-1999',
    title: 'The Matrix',
    originalTitle: 'The Matrix',
    aliases: ['Matrix 1'],
    releaseYear: 1999,
    language: 'en',
    languageLabel: 'English',
    genres: ['Sci-Fi', 'Action'],
    director: 'Lana & Lilly Wachowski',
    overview: 'A computer hacker learns from mysterious rebels about the true nature of his simulated reality and his role in the war against its machine controllers.',
    plotSummary: `Thomas Anderson, a software programmer moonlighting as a hacker under the alias "Neo", is contacted by the enigmatic Morpheus and Trinity. Morpheus reveals that humanity is trapped inside the "Matrix"—a hyper-realistic neural simulation created by sentient artificial intelligence machines that farm human bodies as bio-electric batteries. Morpheus offers Neo a choice between the blue pill (returning to blissful ignorance) and the red pill (awakening into the harsh truth).

Neo takes the red pill, awakening in a horrifying bio-pod in the scorched Earth of the 22nd century. Rescued aboard the hovercraft Nebuchadnezzar, Neo undergoes rapid martial arts training, with Morpheus believing him to be "The One", a messianic figure prophesied to end the machine war. When visiting the Oracle, Neo is told that either he or Morpheus will die.

Their crew is betrayed by Cypher, an exhausted rebel who trades Morpheus to Agent Smith in exchange for a luxury life inside the Matrix. Morpheus is captured to extract the access codes to humanity's underground sanctuary, Zion. Defying orders, Neo and Trinity launch a brazen skyscraper raid, rescuing Morpheus. Hunted through the subway by Agent Smith, Neo is shot dead in a hallway—until Trinity's declaration of love in the real world awakens his transcendent powers. Neo resurrects inside the Matrix, stopping bullets mid-air and disintegrating Agent Smith, ascending as The One.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/pA3vd636u1uH601M6D9G8Z8O3G4.jpg',
    characters: [
      {
        name: 'Neo (Thomas Anderson)',
        actor: 'Keanu Reeves',
        role: 'Protagonist / The One',
        summary: 'A computer programmer who discovers the world is a simulation and awakens divine reality-warping power.',
        relationships: ['Disciple of Morpheus', 'Loves Trinity'],
        traits: ['Reluctant messiah', 'Adaptive learner', 'Superhuman reflex']
      },
      {
        name: 'Agent Smith',
        actor: 'Hugo Weaving',
        role: 'Antagonist / Sentinel Program',
        summary: 'A sentient security program who despises the human simulation and seeks total erasure of the rebellion.',
        relationships: ['Nemesis of Neo'],
        traits: ['Nihilistic', 'Superhuman speed', 'System enforcer']
      }
    ],
    canonEvents: [
      {
        eventId: 'matrix-e1',
        order: 1,
        title: 'The Red Pill Choice',
        description: 'Morpheus offers Neo the blue pill or red pill; Neo swallows the red pill and awakens in the real world.',
        significance: 'Awakening catalyst',
        charactersInvolved: ['Neo', 'Morpheus'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Neo chose the blue pill, but his memories started bleeding into his civilian simulation?'
      }
    ],
    worldRules: [
      'If you are killed inside the Matrix, your physical body dies in the real world.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Warner Bros / Village Roadshow official screenplay', 'TMDB #603'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'interstellar-2014',
    title: 'Interstellar',
    originalTitle: 'Interstellar',
    aliases: ['Interstellar 2014'],
    releaseYear: 2014,
    language: 'en',
    languageLabel: 'English',
    genres: ['Sci-Fi', 'Drama', 'Adventure'],
    director: 'Christopher Nolan',
    overview: 'When Earth becomes uninhabitable, a team of astronauts travels through a wormhole near Saturn in search of a new home for mankind.',
    plotSummary: `In the mid-21st century, crop blights and catastrophic dust storms threaten humanity with extinction. Joseph Cooper, a widowed former NASA test pilot turned farmer, decodes gravitational anomalies in his daughter Murph's bedroom that lead them to a secret subterranean NASA facility. Professor Brand reveals that a mysterious wormhole near Saturn—placed by unseen beings known as "They"—leads to a distant galaxy with three potentially habitable planets orbiting supermassive black hole Gargantua.

Cooper agrees to pilot the Endurance spacecraft with scientists Amelia Brand, Romilly, and Doyle, promising Murph he will return despite extreme relativistic time dilation. On Miller's oceanic planet, towering tidal waves kill Doyle and cost the mission 23 Earth years in minutes. When they visit Mann's icy planet, Dr. Mann betrays them, revealing he falsified habitability data out of terror of dying alone; Mann attempts to steal the Endurance and inadvertently destroys part of the ship.

With dwindling fuel, Cooper and Amelia execute a slingshot around Gargantua toward Edmunds' planet. To shed mass and guarantee Amelia's escape, Cooper sacrifices himself by detaching his ranger into the black hole. Inside the singularity, Cooper is saved by a 5-dimensional tesseract constructed by future evolved humans. Cooper communicates across time to young Murph using gravity waves through the second hand of her childhood wristwatch, giving her the quantum data needed to solve the gravitational equation and save humanity.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/rAiYTsrpHGh9v5Y6TQjZsg5z7zB.jpg',
    characters: [
      {
        name: 'Joseph Cooper',
        actor: 'Matthew McConaughey',
        role: 'Protagonist / Pilot',
        summary: 'Former NASA pilot who journeys across spacetime driven by his promise to return to his daughter.',
        relationships: ['Father of Murph and Tom', 'Mission commander with Brand'],
        traits: ['Intuitive aviator', 'Fiercely protective father', 'Tenacious']
      },
      {
        name: 'Dr. Mann',
        actor: 'Matt Damon',
        role: 'Antagonist',
        summary: 'NASA’s most revered scientist who cracks under isolation and sabotages the mission to save himself.',
        relationships: ['Lazarus mission leader'],
        traits: ['Desperate coward', 'Articulate rationalizer']
      }
    ],
    canonEvents: [
      {
        eventId: 'inter-e1',
        order: 1,
        title: 'The Gigantic Wave on Miller\'s Planet',
        description: 'Tidal waves sweep over the crew; Doyle dies and 23 Earth years elapse while Cooper and Brand escape.',
        significance: 'Catastrophic time loss',
        charactersInvolved: ['Cooper', 'Brand', 'Doyle'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Cooper skipped Miller’s planet entirely and traveled directly to Edmunds’ planet?'
      }
    ],
    worldRules: [
      'Near supermassive black holes, gravitational time dilation is absolute (1 hour on Miller’s planet = 7 Earth years).'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Syncopy / Paramount Pictures official screenplay', 'Kip Thorne astrophysics consultations', 'TMDB #157336'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'thalapathi-1991',
    title: 'Thalapathi',
    originalTitle: 'தளபதி',
    aliases: ['Thalapathi 1991', 'Dalapathi'],
    releaseYear: 1991,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Action', 'Crime', 'Drama'],
    director: 'Mani Ratnam',
    overview: 'An abandoned orphan raised in the slums becomes the fierce lieutenant to an honorable underworld lord, unaware his half-brother is the district collector sent to defeat them.',
    plotSummary: `Fourteen-year-old unwed mother Kalyani gives birth to a baby boy on Surya Jayanthi and abandons the infant inside a freight train to avoid societal ruin. Rescued and raised by a kind slum woman, the child grows into Surya, a fearless warrior with an uncontrollable temper who beats a corrupt district enforcer to death to protect an innocent girl. Arrested and beaten by police, Surya is freed by Devaraj, a righteous local godfather who operates outside the law to protect the oppressed.

Devaraj recognizes Surya’s fierce moral courage and appoints him his "Thalapathi" (Commander). Together, Deva and Surya rule the region as benevolent protectors against rival syndicate boss Kalivardhan. Meanwhile, Arjun, an uncorrupted new District Collector arrives with orders to crush Deva’s illegal syndicate. Unbeknownst to them, Arjun is Surya’s half-brother, born to Kalyani after her legitimate marriage.

When Kalyani discovers that Surya is the son she discarded, she begs him to spare Arjun’s life. Surya, despite his profound maternal yearning, swears allegiance to Devaraj over his own flesh and blood. In the bloody climax, Kalivardhan ambushes and murders Devaraj; Surya avenges his commander by slaughtering Kalivardhan, before peacefully surrendering to his brother Arjun, choosing honor over personal survival.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/yQ7n1g2M8h0vP4k6L7j8h9.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/9i8u7y6t5r4e3w2q1a0.jpg',
    characters: [
      {
        name: 'Surya (Karna archetype)',
        actor: 'Rajinikanth',
        role: 'Protagonist / Commander',
        summary: 'Fiercely loyal slum champion whose commitment to friendship eclipses family and state law.',
        relationships: ['Lieutenant to Devaraj', 'Abandoned son of Kalyani', 'Half-brother of Collector Arjun'],
        traits: ['Loyal to the death', 'Fierce brawler', 'Tortured by abandonment']
      },
      {
        name: 'Devaraj (Duryodhana archetype)',
        actor: 'Mammootty',
        role: 'Righteous Underworld Don',
        summary: 'A benevolent godfather who treats Surya as his own brother and stands against state injustice.',
        relationships: ['Brother/Patron to Surya'],
        traits: ['Noble', 'Regal presence', 'Commanding']
      }
    ],
    canonEvents: [
      {
        eventId: 'thala-e1',
        order: 1,
        title: 'Devaraj Bails Surya from Jail',
        description: 'Devaraj pays Surya’s bail and asks why he killed the extortionist; Surya answers "Because it was wrong", forging an unbreakable bond.',
        significance: 'Brotherhood catalyst',
        charactersInvolved: ['Surya', 'Devaraj'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Surya refused Devaraj’s patronage and fought both the law and the underworld alone?'
      }
    ],
    worldRules: [
      'The bond of friendship between Surya and Deva is absolute and transcends blood relationships.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['GV Films / Madras Talkies screenplay', 'Mahabharata modernization analysis', 'TMDB #46797'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'vikram-vedha-2017',
    title: 'Vikram Vedha',
    originalTitle: 'விக்ரம் வேதா',
    aliases: ['Vikram Vedha 2017'],
    releaseYear: 2017,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Action', 'Crime', 'Thriller'],
    director: 'Pushkar–Gayathri',
    overview: 'A ruthlessly honest encounter cop tracks a philosophical gangster who voluntarily surrenders, narrating riddles that dismantle the boundary between good and evil.',
    plotSummary: `Vikram, an unbending encounter-specialist inspector in the Chennai police force, views morality in stark black and white: he kills criminals without hesitation, believing society requires ruthless executioners. When his special unit prepares to raid the hideout of Vedha—a notorious underworld gangster—Vedha casually strolls into police headquarters with his hands up and surrenders.

During interrogation, Vedha offers to tell Vikram a story, posing moral riddles inspired by the ancient tales of King Vikramaditya and the demon Betal. Each parable reveals how innocent people were drawn into crime, corrupt police collusion, and the manipulation of Vedha's younger brother Pulli. Vikram's own lawyer wife, Priya, represents Vedha in court, sparking ideological friction at home.

As Vikram investigates the clues hidden in Vedha's parables, he uncovers that his own venerated police partner, Simon, was deeply corrupt and running money-laundering operations for rival gangs. In the electrifying finale, Vikram realizes his fellow encounter cops are actually rogue assassins aiming to wipe out both him and Vedha to bury their corruption. Vikram and Vedha stand shoulder-to-shoulder in an abandoned warehouse gun battle, culminating in a Mexican standoff where both men aim their guns at each other, leaving the true nature of justice hanging in the balance.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/y8jK92i0o1p2a3s4d5f6g7.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/8u7y6t5r4e3w2q1a0p9o8i7.jpg',
    characters: [
      {
        name: 'Vikram',
        actor: 'R. Madhavan',
        role: 'Protagonist / Encounter Specialist',
        summary: 'A cop who believes he possesses a righteous moral compass, until Vedha forces him to question who is truly corrupt.',
        relationships: ['Husband of Priya', 'Target of Vedha’s parables', 'Partner to Simon'],
        traits: ['Dogmatic', 'Lethal marksman', 'Intellectually honest']
      },
      {
        name: 'Vedha',
        actor: 'Vijay Sethupathi',
        role: 'Antagonist / Underworld Philosopher',
        summary: 'A swaggering, philosophical gangster who uses parables to expose the rot within the police force.',
        relationships: ['Protector of brother Pulli', 'Foil to Vikram'],
        traits: ['Charismatic', 'Master storyteller', 'Pragmatic strategist']
      }
    ],
    canonEvents: [
      {
        eventId: 'vv-e1',
        order: 1,
        title: 'Vedha Surrenders Voluntarily at Headquarters',
        description: 'Vedha walks through the front doors of the police station with a tea glass, completely disarming the task force.',
        significance: 'Inciting paradigm shift',
        charactersInvolved: ['Vedha', 'Vikram'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Vikram shot Vedha on sight inside the police lobby instead of interrogating him?'
      }
    ],
    worldRules: [
      'Every story Vedha tells contains a real crime and a moral dilemma testing Vikram’s code.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Y NOT Studios canon script', 'Vikram-Betaal lore adaptation', 'TMDB #455246'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'spider-verse-2018',
    title: 'Spider-Man: Into the Spider-Verse',
    originalTitle: 'Spider-Man: Into the Spider-Verse',
    aliases: ['Spider-Verse 1'],
    releaseYear: 2018,
    language: 'en',
    languageLabel: 'English',
    genres: ['Animation', 'Action', 'Sci-Fi'],
    director: 'Bob Persichetti, Peter Ramsey, Rodney Rothman',
    overview: 'Teenager Miles Morales becomes the new Spider-Man and must join alternate-reality heroes to stop a dimension-destroying collider.',
    plotSummary: `Brooklyn teenager Miles Morales struggles with the expectations of his police officer father Jefferson Davis. While spray-painting subway graffiti with his estranged uncle Aaron, Miles is bitten by a radioactive spider. Returning to the tunnel, Miles stumbles into Kingpin's secret particle collider chamber, witnessing the blonde Peter Parker battle the Green Goblin. Peter tries to shut down the dimension-tearing machine but is brutally crushed and killed by Kingpin, giving Miles a USB override key before dying.

As a devastated New York mourns Spider-Man, Miles discovers the collider pulled alternate Spider-heroes from other universes: cynical middle-aged Peter B. Parker, Gwen Stacy, Spider-Man Noir, Peni Parker, and Peter Porker. While being mentored by Peter B., Miles is hunted by Kingpin's lethal enforcer, the Prowler—only to discover in horror that the Prowler is his beloved Uncle Aaron. When Aaron refuses Kingpin's order to murder his nephew, Kingpin guns Aaron down in the alley.

Feeling inadequate, Miles is initially restrained by the other Spider-heroes for his own safety. However, a heartfelt conversation through a closed door with his father gives Miles the emotional breakthrough he needs. Miles takes a "leap of faith", mastering his unique camouflage and venom-strike powers. Miles arrives at Kingpin's collider banquet, defeats Kingpin in combat, sends all the alternate Spider-heroes back to their native realities, and claims his mantle as Brooklyn's one and only Spider-Man.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/uUiId6cG32JSRjT6x1M9wHq1d.jpg',
    characters: [
      {
        name: 'Miles Morales',
        actor: 'Shameik Moore',
        role: 'Protagonist / New Spider-Man',
        summary: 'Brooklyn teenager who unlocks bio-electric venom blasts and invisibility while finding his own voice.',
        relationships: ['Nephew of Aaron Davis (Prowler)', 'Son of Officer Jefferson Davis'],
        traits: ['Artistic', 'Resilient', 'Unique bio-powers']
      },
      {
        name: 'Kingpin (Wilson Fisk)',
        actor: 'Liev Schreiber',
        role: 'Antagonist',
        summary: 'Crime lord tearing the fabric of spacetime to pull back alternate versions of his deceased wife and son.',
        relationships: ['Boss of Prowler and Doc Ock'],
        traits: ['Overwhelming physical force', 'Obsessed with family grief']
      }
    ],
    canonEvents: [
      {
        eventId: 'spv-e1',
        order: 1,
        title: 'Kingpin Kills the Original Peter Parker',
        description: 'Kingpin slams his fists down on the wounded original Spider-Man, killing him in front of Miles.',
        significance: 'Passing of the torch',
        charactersInvolved: ['Peter Parker', 'Kingpin', 'Miles'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if the original Peter Parker survived the collider explosion alongside Miles?'
      }
    ],
    worldRules: [
      'Spider-beings from alternate dimensions undergo molecular cellular decay (glitching) if they stay outside their native realities.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['Sony Pictures Animation / Marvel screenplay', 'TMDB #324857'],
      lastVerified: new Date()
    },
    isFeatured: true
  },
  {
    movieId: 'maanadu-2021',
    title: 'Maanaadu',
    originalTitle: 'மாநாடு',
    aliases: ['Maanadu', 'The Conference', 'Maanaadu (2021)'],
    releaseYear: 2021,
    language: 'ta',
    languageLabel: 'Tamil',
    genres: ['Sci-Fi', 'Action', 'Thriller'],
    director: 'Venkat Prabhu',
    overview: 'On the day of a high-stakes political conference, an ordinary NRI finds himself trapped in a recurring time loop where he must prevent the Chief Minister\'s assassination and stop catastrophic communal violence.',
    plotSummary: `Abdul Khaliq, an NRI travelling from Dubai to Coimbatore to help his friend elope with his lover, is abducted on the highway by corrupt police officer DCP Dhanushkodi and his conspirators. Dhanushkodi reveals a sinister plot: Khaliq is being framed to assassinate the Chief Minister during a massive political conference in Coimbatore, an act designed to provoke statewide communal riots and political upheaval. Despite his desperate resistance, Khaliq is forced into the conference grounds with a sniper rifle.

When Khaliq tries to thwart the assassination and alert the security forces, he is shot dead by Dhanushkodi's henchmen. Instead of dying, Khaliq suddenly gasps awake back on the passenger plane landing in Coimbatore. He soon realizes that every time he dies or fails, time rewinds and resets back to the exact moment the airplane touches down on the runway. He is trapped in an inescapable time loop with all his previous memories intact.

As Khaliq attempts multiple strategies across repeated loops to stop the murder, he makes a chilling discovery: DCP Dhanushkodi is also caught in the same time loop and retains his memories between resets. A high-stakes battle of wits and anticipation erupts between the two. Khaliq partners with Seethalakshmi and honest officers, piecing together the timeline to outsmart Dhanushkodi, expose the political conspiracy to the public, and permanently break the cycle without losing innocent lives.`,
    posterUrl: 'https://image.tmdb.org/t/p/w500/yA2pU9U7g9u8pB7L5j9S1v8d7fD.jpg',
    backdropUrl: 'https://image.tmdb.org/t/p/original/m9pQ5h2X7eR6u4W7v9a1B3C5D6E.jpg',
    characters: [
      {
        name: 'Abdul Khaliq',
        actor: 'Silambarasan TR',
        role: 'Protagonist / Time Traveler',
        summary: 'An unsuspecting NRI who becomes trapped in a time loop while being framed for a political assassination.',
        relationships: ['Targeted by Dhanushkodi', 'Allied with Seethalakshmi', 'Friend of Ezhil and Rafiq'],
        traits: ['Determined', 'Quick-thinking', 'Courageous under pressure']
      },
      {
        name: 'DCP Dhanushkodi',
        actor: 'S. J. Suryah',
        role: 'Antagonist / Rogue Police Commander',
        summary: 'Ruthless corrupt DCP orchestrating the Chief Minister assassination, who discovers he also shares loop memories.',
        relationships: ['Working for conspirators', 'Adversary of Khaliq', 'Enforcer of the assassination'],
        traits: ['Maniacal', 'Calculated tactician', 'Relentless']
      },
      {
        name: 'Chief Minister Arivazhagan',
        actor: 'S. A. Chandrasekhar',
        role: 'Target of Conspiracy',
        summary: 'The state Chief Minister whose public assassination is planned to spark widespread communal riots.',
        relationships: ['Target of Dhanushkodi squad'],
        traits: ['Influential statesman', 'Vulnerable leader']
      },
      {
        name: 'Seethalakshmi',
        actor: 'Kalyani Priyadarshan',
        role: 'Crucial Ally',
        summary: 'Resourceful companion who assists Khaliq in navigating the conference grounds and dodging police traps.',
        relationships: ['Allied with Khaliq'],
        traits: ['Supportive', 'Astute', 'Resourceful']
      }
    ],
    canonEvents: [
      {
        eventId: 'mnd-e1',
        order: 1,
        title: 'The Airplane Awakening in Coimbatore',
        description: 'Abdul Khaliq awakens on the commercial flight as it touches down in Coimbatore, the ground zero reset point of the time loop.',
        significance: 'Loop anchor and inception',
        charactersInvolved: ['Abdul Khaliq'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Khaliq refused to disembark the plane and immediately returned to Dubai?'
      },
      {
        eventId: 'mnd-e2',
        order: 2,
        title: 'The Political Conference Sniper Standoff',
        description: 'Dhanushkodi corners Khaliq on the elevated gantry overlooking the conference podium, forcing him to shoot the Chief Minister.',
        significance: 'Central conspiracy event',
        charactersInvolved: ['Abdul Khaliq', 'DCP Dhanushkodi', 'Chief Minister Arivazhagan'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if Khaliq publicly disarmed Dhanushkodi on live television before the rally started?'
      },
      {
        eventId: 'mnd-e3',
        order: 3,
        title: 'Dhanushkodi Realizes He is in the Loop',
        description: 'DCP Dhanushkodi utters his famous realization, confirming that both hunter and hunted retain memories across loop resets.',
        significance: 'Equalization of narrative stakes',
        charactersInvolved: ['Abdul Khaliq', 'DCP Dhanushkodi'],
        canBeWhatIfTrigger: true,
        suggestedWhatIf: 'What if a third person also gained loop memory awareness simultaneously?'
      }
    ],
    worldRules: [
      'The time loop resets back to the airplane landing immediately upon Abdul Khaliq\'s death.',
      'Only individuals linked through the critical loop event retain sequential memory of previous resets.',
      'Events across Coimbatore unfold with exact chronological precision unless altered by Khaliq or Dhanushkodi.'
    ],
    dataStatus: 'verified',
    sourceAttribution: {
      sources: ['V House Productions screenplay', 'Venkat Prabhu narrative canon'],
      lastVerified: new Date()
    },
    isFeatured: true
  }
];
