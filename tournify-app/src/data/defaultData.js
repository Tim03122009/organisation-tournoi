import {
  NOE_LAMBERT_AREA,
  NOE_LAMBERT_CENTER,
  NOE_LAMBERT_LABEL,
} from "../utils/locationArea";
import { createDefaultPointScheme } from "./scoringDefaults";

export const defaultTournament = {
  name: "Gestion tournoi",
  isOnline: false,
  sportType: "team",
  audienceOpen: false,
  pointsOpen: false,
  pointSchemes: [createDefaultPointScheme(1)],
  extraPointTypes: [],
  playerStatTypes: [],
  selectedDivision: "U11",
  matchDuration: 17,
  calendarLocked: false,
  planSelection: { poules: "", days: "", terrains: "" },
  refereeMode: "one_per_match",
  teamsAsReferees: false,
  days: [{ id: 1, date: "2026-06-17", label: "Mercredi 17 juin 2026" }],
  locations: [
    {
      id: 1,
      label: NOE_LAMBERT_LABEL,
      lat: NOE_LAMBERT_CENTER.lat,
      lng: NOE_LAMBERT_CENTER.lng,
      area: NOE_LAMBERT_AREA,
      showLogo: true,
      logo: null,
    },
  ],
  divisions: [
    { id: 1, name: "U7", color: "#e53935" },
    { id: 2, name: "U9", color: "#fb8c00" },
    { id: 3, name: "U11", color: "#1e88e5" },
    { id: 4, name: "U13", color: "#43a047" },
    { id: 5, name: "U15-U17", color: "#ec407a" },
  ],
  languages: ["fr", "en"],
  teamFields: [
    { id: "present", label: "Présent", standard: true, enabled: true },
    { id: "paye", label: "Payé", standard: true, enabled: false },
    { id: "email", label: "E-mail", standard: true, enabled: true },
    { id: "ajoute", label: "Ajouté", standard: true, enabled: false },
    { id: "pays", label: "Pays", standard: true, enabled: false },
    { id: "logo", label: "Logo", standard: true, enabled: true },
    { id: "vestiaire", label: "Vestiaire", standard: true, enabled: false },
    { id: "joueurs", label: "Joueurs", standard: true, enabled: true },
    { id: "lien", label: "Lien de connexion", standard: true, enabled: true, help: true },
  ],
  inscriptionQuestions: [
    { id: "departement", label: "De quel département ?", enabled: true },
  ],
  playerFields: [
    { id: "nom", label: "Nom", enabled: true, locked: true },
    { id: "naissance", label: "Date de naissance", enabled: true },
    { id: "numero", label: "Numéro", enabled: true },
  ],
  teams: [
    { id: 1, name: "Equipe H", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U11", connectionToken: "equipeh01" },
    { id: 2, name: "Equipe G", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U11", connectionToken: "equipeg02" },
    { id: 3, name: "Equipe F", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U11", connectionToken: "equipef03" },
    { id: 4, name: "Equipe E", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U11", connectionToken: "equipee04" },
    { id: 5, name: "Equipe D", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U9", connectionToken: "equiped05" },
    { id: 6, name: "Equipe C", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U9", connectionToken: "equipec06" },
    { id: 7, name: "Equipe B", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U7", connectionToken: "equipeb07" },
    { id: 8, name: "Equipe A", email: "", players: 0, playerList: [], departement: "", present: false, paye: false, ajoute: false, division: "U7", connectionToken: "equipea08" },
  ],
  refereeFields: [
    { id: "present", label: "Présent", standard: true, enabled: true },
    { id: "disponible", label: "Disponible", standard: true, enabled: true },
    { id: "email", label: "E-mail", standard: true, enabled: true },
    { id: "telephone", label: "Téléphone", standard: true, enabled: false },
    { id: "club", label: "Club", standard: true, enabled: true },
    { id: "niveau", label: "Niveau", standard: true, enabled: false },
    { id: "experience", label: "Expérience", standard: true, enabled: true, help: true },
    { id: "pays", label: "Pays", standard: true, enabled: false },
    { id: "lien", label: "Lien de connexion", standard: true, enabled: true, help: true },
    { id: "divisions", label: "Division", standard: true, enabled: true },
  ],
  referees: [
    { id: 1, name: "Jules", email: "", telephone: "", club: "", niveau: "", experience: "Accompagnateur", pays: "", divisions: "U7", present: false, disponible: true, connectionToken: "arbitre01", fields: {} },
    { id: 2, name: "Pierre", email: "", telephone: "", club: "", niveau: "", experience: "Normal", pays: "", divisions: "U11", present: false, disponible: true, connectionToken: "arbitre02", fields: {} },
    { id: 3, name: "Timéo", email: "", telephone: "", club: "", niveau: "", experience: "Novice", pays: "", divisions: "U9", present: false, disponible: true, connectionToken: "arbitre03", fields: {} },
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
  unscheduledSlots: Array.from({ length: 24 }, (_, i) => ({
    id: i + 1,
    poule: i % 2 === 0 ? "Poule A" : "Poule B",
    label: "Emplacement vide",
  })),
  presentation: {
    websiteActive: true,
    websiteUrl: "https://example.com/tournoi",
    showInApp: true,
    adminLink: "https://gestion-tournoi.local/admin/abc123",
    generalSettings: {
      showLogo: true,
      showSponsors: true,
      showStandings: true,
    },
    standingsShowPoints: true,
    standingsColumns: {},
    slideshowSettings: {
      showTournamentName: true,
      showCurrentTime: true,
    },
    designAssets: { logo: null, context: null, sponsors: null },
    sponsorBlocks: [{ id: 1, name: "Bloc 1" }],
    pageContent: {
      tournoi: { description: "", mergeSponsors: false, attachments: [], images: [] },
      inscrire: {
        open: true,
        intro: "",
        maxRegistrations: "",
        fee: "",
        sendConfirmation: true,
        subject: "",
        footer: "",
      },
    },
    registrationQuestions: [
      { id: 1, text: "Quel est le nom de votre équipe ?" },
      { id: 2, text: "Quel est votre logo ?" },
      { id: 3, text: "Quelle division ?" },
    ],
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

export function createAccountShell() {
  return {
    ...defaultTournament,
    hasTournament: false,
    name: "",
    selectedDivision: "",
    teams: [],
    referees: [],
    admins: [],
    divisions: [],
    phases: [],
    terrains: [],
    days: [],
    locations: [],
    unscheduledMatches: 0,
    totalMatches: 0,
    unscheduledSlots: [],
    scores: { phases: [], matchSlots: [] },
  };
}

export function createBlankTournament(name = "Nouveau tournoi") {
  return {
    ...createAccountShell(),
    hasTournament: true,
    name: String(name || "").trim() || "Nouveau tournoi",
    createdAt: Date.now(),
  };
}

export function looksLikeSeedTournament(data) {
  if (!data || typeof data !== "object") return true;
  if (data.hasTournament === true) return false;
  if (data.hasTournament === false) return true;

  const teamNames = (data.teams || []).map((team) => team.name);
  const refereeNames = (data.referees || []).map((ref) => ref.name);
  const seedTeamNames = defaultTournament.teams.map((team) => team.name);
  const seedRefereeNames = defaultTournament.referees.map((ref) => ref.name);

  const sameTeams =
    teamNames.length === seedTeamNames.length &&
    seedTeamNames.every((name) => teamNames.includes(name));
  const sameReferees =
    refereeNames.length === seedRefereeNames.length &&
    seedRefereeNames.every((name) => refereeNames.includes(name));
  const seedName = !data.name || data.name === defaultTournament.name;

  return seedName && sameTeams && sameReferees;
}
