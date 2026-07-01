import abhinish from "@/assets/alumni/abhinish.jpg.asset.json";
import krish from "@/assets/alumni/krish.jpg.asset.json";
import akhil from "@/assets/alumni/akhil_patiyal.jpg.asset.json";
import manishRana from "@/assets/alumni/manish_rana.jpg.asset.json";
import rohit from "@/assets/alumni/rohit_kumar.jpg.asset.json";
import kartik from "@/assets/alumni/kartik.jpg.asset.json";
import nitin from "@/assets/alumni/nitin_negi.jpg.asset.json";
import manish from "@/assets/alumni/manish.jpg.asset.json";
import sumit from "@/assets/alumni/sumit.jpg.asset.json";
import virender from "@/assets/alumni/virender.jpg.asset.json";

// Match by exact "Name|Company" key to disambiguate duplicates
const EXACT: Record<string, string> = {
  "Rohit Kumar|Suzuki Motors": rohit.url,
  "Abinish|Dr. Reddys": abhinish.url,
  "Krish|Dr. Reddys": krish.url,
  "Akhil Patiyal|Dr. Reddys": akhil.url,
  "Manish Rana|Dr. Reddys": manishRana.url,
  "Katik|Zydus Life Sciences": kartik.url,
  "Nitin Negi|Lemon Tree Hotels": nitin.url,
  "Manish|Maruti Suzuki Ltd.": manish.url,
  "Sumit Sharma|Crompton Greaves": sumit.url,
  "Virender|Crompton Greaves": virender.url,
};

export function alumniPhoto(name: string, company: string): string | null {
  return EXACT[`${name}|${company}`] ?? null;
}
