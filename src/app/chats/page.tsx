import Header from "@/components/layout/groups/header";
import ListGroups from "@/components/layout/groups/ListGroups";

export default function page() {
  return (
    <main className="max-w-sm mx-auto p-5">
      <Header />
      <hr />
      <ListGroups />
    </main>
  );
}
