import abhinish from "@/assets/alumni/abhinish.jpg.asset.json";
import krish from "@/assets/alumni/krish.jpg.asset.json";
import akhil from "@/assets/alumni/akhil_patiyal.jpg.asset.json";
import manishRana from "@/assets/alumni/manish_rana.jpg.asset.json";
import rohitOld from "@/assets/alumni/Rohit.jpg.asset.json";
import kartik from "@/assets/alumni/kartik.jpg.asset.json";
import nitin from "@/assets/alumni/nitin_negi.jpg.asset.json";
import manish from "@/assets/alumni/manish.jpg.asset.json";
import sumit from "@/assets/alumni/sumit.jpg.asset.json";
import virender from "@/assets/alumni/virender.jpg.asset.json";
import ankush from "@/assets/alumni/Ankush.jpeg.asset.json";
import dhairya from "@/assets/alumni/Dhairya.jpeg.asset.json";
import happy from "@/assets/alumni/Happy.jpeg.asset.json";
import manjeet from "@/assets/alumni/Manjeet.jpeg.asset.json";
import pradeepKM from "@/assets/alumni/Pradeep_Kumar.jpeg.asset.json";
import pradeepDR from "@/assets/alumni/Pradeep.jpeg.asset.json";
import rishav from "@/assets/alumni/Rishav.jpeg.asset.json";
import rohitNew from "@/assets/alumni/rohit_kumar.jpg.asset.json";
import sachet from "@/assets/alumni/Sachet.jpeg.asset.json";
import sachinn from "@/assets/alumni/Sachin.jpeg.asset.json";
import sachin from "@/assets/alumni/Sachinn.jpeg.asset.json";
import vikas from "@/assets/alumni/Vikas.jpeg.asset.json";

void rohitOld;

// Match by exact "Name|Company" key to disambiguate duplicates
const EXACT: Record<string, string> = {
  "Rohit Kumar|Suzuki Motors": rohitNew.url,
  "Rohit Kumar|Sickle Innovation": rohitNew.url,
  "Manjeet Kumar|IDMC": manjeet.url,
  "Sachin|IDMC": sachin.url,
  "Sachin|Krishna Maruti": sachinn.url,
  "Vikas Thakur|Centum Electronics": vikas.url,
  "Happy|IDMC": happy.url,
  "Rishav Bharol|Godrej & Boyce": rishav.url,
  "Pradeep Kumar|Dr. Reddy": pradeepDR.url,
  "Pradeep Kumar|Krishna Maruti": pradeepKM.url,
  "Sachet Majtoo|Krishna Maruti": sachet.url,
  "Ankush Sharma|Krishna Maruti": ankush.url,
  "Dhairya Bragta|Jayshree Polymer": dhairya.url,
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
