import { redirect } from "next/navigation";
import Profile from "@/components/dashboard/Profile";
import { getAuthUserFromCookies } from "@/lib/auth-next";

export const revalidate = 0;

const fetchUserDetails = async () => {
  const user = await getAuthUserFromCookies();

  if (!user) {
    redirect("/");
  }

  const name = user.name;
  const email = user.email;
  return { name, email };
};

const ProfilePage = async () => {
  const details = await fetchUserDetails();

  return <Profile {...details} />;
};

export default ProfilePage;
