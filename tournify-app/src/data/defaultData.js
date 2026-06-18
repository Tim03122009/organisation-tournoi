export const defaultTournament = {
  name: "Gestion tournoi",
  isOnline: false,
  days: [{ id: 1, label: "Mercredi 17 juin 2026" }],
  locations: [
    {
      id: 1,
      label:
        "Touch & Rugby 1er club de Nantes Est - Mail Lambert Rugby, Route de Sainte-Luce",
    },
  ],
  divisions: [
    { id: 1, name: "U7", color: "#e53935" },
    { id: 2, name: "U9", color: "#fb8c00" },
    { id: 3, name: "U11", color: "#1e88e5" },
    { id: 4, name: "U13", color: "#43a047" },
    { id: 5, name: "U15-U17", color: "#ec407a" },
  ],
  languages: ["fr"],
  teamFields: [
    { id: "prenom", label: "Prénom", standard: true, enabled: true },
    { id: "nom", label: "Nom", standard: true, enabled: true },
    { id: "email", label: "E-mail", standard: true, enabled: true },
    { id: "telephone", label: "Téléphone", standard: true, enabled: true },
    { id: "region", label: "De quelle région ?", standard: true, enabled: true },
  ],
  playerFields: [
    { id: "nom", label: "Nom", enabled: true },
    { id: "naissance", label: "Date de naissance", enabled: true },
    { id: "numero", label: "Numéro", enabled: true },
  ],
  teams: [
    { id: 1, name: "Equipe H", email: "", players: 1, region: "" },
    { id: 2, name: "Equipe G", email: "", players: 1, region: "" },
    { id: 3, name: "Equipe F", email: "", players: 1, region: "" },
    { id: 4, name: "Equipe E", email: "", players: 1, region: "" },
    { id: 5, name: "Equipe D", email: "", players: 1, region: "" },
    { id: 6, name: "Equipe C", email: "", players: 1, region: "" },
    { id: 7, name: "Equipe B", email: "", players: 1, region: "" },
    { id: 8, name: "Equipe A", email: "", players: 1, region: "" },
  ],
  refereeFields: [
    { id: "pays", label: "Pays", enabled: true },
    { id: "lien", label: "Lien de connexion", enabled: true },
    { id: "divisions", label: "Divisions", enabled: true },
  ],
  referees: [
    { id: 1, name: "Jules", link: "", divisions: "" },
    { id: 2, name: "Pierre", link: "", divisions: "" },
    { id: 3, name: "Timéo", link: "", divisions: "" },
  ],
  admins: [],
  phases: [
    {
      id: 1,
      name: "Phase de groupes",
      division: "U11",
      items: [
        {
          id: 1,
          type: "poule",
          name: "Poule A",
          teams: ["Equipe C", "Equipe D", "Equipe E", "Equipe F"],
        },
        {
          id: 2,
          type: "poule",
          name: "Poule B",
          teams: ["Equipe A", "Equipe B", "Equipe G", "Equipe H"],
        },
      ],
    },
    {
      id: 2,
      name: "Phase éliminatoire",
      division: "U11",
      items: [
        {
          id: 3,
          type: "bracket",
          name: "Bracket C",
          teams: ["VAINQUEUR C1", "VAINQUEUR C2", "VAINQUEUR C3", "VAINQUEUR C4"],
        },
      ],
    },
  ],
  terrains: [
    {
      id: 1,
      name: "Terrain 1",
      events: [
        {
          id: 1,
          time: "10:00",
          type: "match",
          team1: "Equipe C",
          team2: "Equipe E",
          poule: "Poule A",
          referee: "Pierre",
        },
        {
          id: 2,
          time: "10:17",
          type: "match",
          team1: "Equipe D",
          team2: "Equipe G",
          poule: "Poule A",
          referee: "Timéo",
        },
        {
          id: 3,
          time: "10:34",
          type: "pause",
          duration: "30 minutes",
        },
      ],
    },
    {
      id: 2,
      name: "Terrain 2",
      events: [
        {
          id: 4,
          time: "10:00",
          type: "match",
          team1: "Equipe A",
          team2: "Equipe B",
          poule: "Poule B",
          referee: "Jules",
        },
      ],
    },
  ],
  unscheduledMatches: 24,
  totalMatches: 37,
  presentation: {
    websiteActive: true,
    websiteUrl: "https://example.com/tournoi",
    showInApp: true,
    pages: [
      { id: "tournoi", name: "Tournoi", enabled: true },
      { id: "equipe", name: "Mon équipe", enabled: true },
      { id: "classements", name: "Classements", enabled: true },
      { id: "calendrier", name: "Calendrier", enabled: true },
      { id: "arbitres", name: "Arbitres", enabled: true },
      { id: "inscrire", name: "S'inscrire", enabled: true },
    ],
    slideshow: [
      { id: 1, title: "Poule A - Phase de groupes", duration: 10, active: true },
      { id: 2, title: "Poule B - Phase de groupes", duration: 10, active: true },
      { id: 3, title: "Code QR", duration: 10, active: true },
      { id: 4, title: "Matches à venir", duration: 10, active: true },
      { id: 5, title: "Classement", duration: 10, active: true },
    ],
    designColor: "#3514FF",
  },
  scores: {
    phases: [
      { name: "Phase de groupes", done: 12, total: 12 },
      { name: "Phase éliminatoire", done: 1, total: 1 },
      { name: "Phase de groupes", done: 0, total: 0 },
    ],
    matchSlots: [
      {
        time: "10:00",
        matches: [
          {
            terrain: "Terrain 1",
            team1: "Equipe C",
            team2: "Equipe E",
            score1: null,
            score2: null,
            poule: "Poule A",
            division: "U7",
            referee: "Pierre",
          },
        ],
      },
      {
        time: "10:17",
        expanded: true,
        matches: [
          {
            terrain: "Terrain 1",
            team1: "Equipe D",
            team2: "Equipe G",
            score1: 4,
            score2: 4,
            poule: "Poule A",
            division: "U7",
            referee: "Timéo",
          },
          {
            terrain: "Terrain 2",
            team1: "Equipe A",
            team2: "Equipe B",
            score1: null,
            score2: null,
            poule: "Poule B",
            division: "U7",
            referee: "Jules",
          },
        ],
      },
      {
        time: "10:34",
        matches: [],
      },
    ],
  },
};
