import teamImg from "../assets/empty-teams.png";
import refereeImg from "../assets/empty-referees.png";
import adminImg from "../assets/empty-admins.png";

const IMAGES = {
  team: teamImg,
  referee: refereeImg,
  admin: adminImg,
};

export default function EmptyJersey({ variant = "team" }) {
  return (
    <img className="empty-jersey" src={IMAGES[variant] || IMAGES.team} alt="" />
  );
}
