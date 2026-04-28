"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getUserProfile,
  saveUserProfile,
  getEmergencyProfileByUserId,
} from "@/lib/firestoreHelpers";
import { db } from "@/lib/firebase/clientApp";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import type { UserProfile, EmergencyProfile } from "@/types";
import { nanoid } from "nanoid";
import toast from "react-hot-toast";
import { EmergencyQR } from "@/components/profile/EmergencyQR";
import { Spinner } from "@/components/ui/Spinner";
import { UserCircle, ShieldAlert, Save } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingQR, setGeneratingQR] = useState(false);
  
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    name: "",
    age: null,
    gender: "",
    bloodGroup: "",
    allergies: [],
    chronicConditions: [],
    emergencyContact: { name: "", relation: "", phone: "" },
  });
  
  const [qrSlug, setQrSlug] = useState<string | null>(null);

  // For array inputs
  const [allergyInput, setAllergyInput] = useState("");
  const [conditionInput, setConditionInput] = useState("");

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const [prof, emProfile] = await Promise.all([
          getUserProfile(user.uid),
          getEmergencyProfileByUserId(user.uid),
        ]);
        
        if (prof) setProfile(prof);
        if (emProfile) setQrSlug(emProfile.qrSlug);
        
      } catch (error) {
        console.error("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await saveUserProfile(user.uid, {
        ...profile,
        email: user.email || "",
        id: user.uid,
      });
      toast.success("Profile saved");
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!user) return;
    if (!profile.bloodGroup) {
      toast.error("Please fill out your blood group and save first.");
      return;
    }
    
    setGeneratingQR(true);
    try {
      // Create or overwrite emergency profile
      const slug = qrSlug || nanoid(8);
      const emRef = doc(db, "emergency_profiles", user.uid);
      
      const emData: Partial<EmergencyProfile> = {
        id: user.uid,
        userId: user.uid,
        qrSlug: slug,
        name: profile.name || "",
        age: profile.age || null,
        bloodGroup: profile.bloodGroup || "",
        allergies: profile.allergies || [],
        chronicConditions: profile.chronicConditions || [],
        emergencyContact: profile.emergencyContact || { name: "", relation: "", phone: "" },
        updatedAt: Timestamp.now(),
      };
      
      await setDoc(emRef, emData, { merge: true });
      setQrSlug(slug);
      toast.success(qrSlug ? "QR Data updated!" : "Emergency QR Generated!");
      
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate QR");
    } finally {
      setGeneratingQR(false);
    }
  };

  const addArrayItem = (field: "allergies" | "chronicConditions", value: string, setter: (val: string) => void) => {
    if (!value.trim()) return;
    setProfile(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }));
    setter("");
  };

  const removeArrayItem = (field: "allergies" | "chronicConditions", index: number) => {
    setProfile(prev => {
      const arr = [...(prev[field] || [])];
      arr.splice(index, 1);
      return { ...prev, [field]: arr };
    });
  };

  if (loading) return <div className="flex justify-center p-12"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <header>
        <h1 className="page-heading flex items-center gap-3">
          <UserCircle className="h-8 w-8 text-blue-400" />
          My Profile
        </h1>
        <p className="text-slate-400 mt-2">Manage your personal and emergency medical details.</p>
      </header>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSave} className="glass-card p-6 space-y-6">
            <h2 className="section-heading mb-4 border-b border-white/10 pb-2">Basic Info</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input required type="text" className="input-field" value={profile.name || ""} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Age</label>
                <input required type="number" className="input-field" value={profile.age || ""} onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })} />
              </div>
              <div>
                <label className="label">Gender</label>
                <select required className="input-field" value={profile.gender || ""} onChange={(e) => setProfile({ ...profile, gender: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="label">Blood Group</label>
                <select required className="input-field" value={profile.bloodGroup || ""} onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}>
                  <option value="">Select...</option>
                  <option value="A+">A+</option><option value="A-">A-</option>
                  <option value="B+">B+</option><option value="B-">B-</option>
                  <option value="O+">O+</option><option value="O-">O-</option>
                  <option value="AB+">AB+</option><option value="AB-">AB-</option>
                </select>
              </div>
            </div>

            <h2 className="section-heading mt-8 mb-4 border-b border-white/10 pb-2">Medical Profile</h2>
            <div className="space-y-4">
              <div>
                <label className="label">Allergies</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" className="input-field" placeholder="E.g., Penicillin, Peanuts" value={allergyInput} onChange={e => setAllergyInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('allergies', allergyInput, setAllergyInput))} />
                  <button type="button" onClick={() => addArrayItem('allergies', allergyInput, setAllergyInput)} className="btn-secondary">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.allergies?.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm flex items-center gap-2">
                      {item} <button type="button" onClick={() => removeArrayItem('allergies', i)} className="text-red-400 hover:text-red-300">&times;</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Chronic Conditions</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" className="input-field" placeholder="E.g., Type 2 Diabetes, Hypertension" value={conditionInput} onChange={e => setConditionInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArrayItem('chronicConditions', conditionInput, setConditionInput))} />
                  <button type="button" onClick={() => addArrayItem('chronicConditions', conditionInput, setConditionInput)} className="btn-secondary">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profile.chronicConditions?.map((item, i) => (
                    <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm flex items-center gap-2">
                      {item} <button type="button" onClick={() => removeArrayItem('chronicConditions', i)} className="text-red-400 hover:text-red-300">&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <h2 className="section-heading mt-8 mb-4 border-b border-white/10 pb-2">Emergency Contact</h2>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="label">Name</label>
                <input required type="text" className="input-field" value={profile.emergencyContact?.name || ""} onChange={(e) => setProfile({ ...profile, emergencyContact: { ...profile.emergencyContact!, name: e.target.value }})} />
              </div>
              <div>
                <label className="label">Relation</label>
                <input required type="text" className="input-field" value={profile.emergencyContact?.relation || ""} onChange={(e) => setProfile({ ...profile, emergencyContact: { ...profile.emergencyContact!, relation: e.target.value }})} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input required type="tel" className="input-field" value={profile.emergencyContact?.phone || ""} onChange={(e) => setProfile({ ...profile, emergencyContact: { ...profile.emergencyContact!, phone: e.target.value }})} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={saving} className="btn-primary w-full sm:w-auto">
                {saving ? <Spinner size="sm" /> : <><Save className="h-4 w-4"/> Save Profile</>}
              </button>
            </div>
          </form>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="section-heading flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-emerald-400" />
              Emergency QR
            </h2>
            <p className="text-sm text-slate-400 mb-6">
              Generate a public QR code that paramedics can scan to instantly see your blood group, allergies, and emergency contact.
            </p>
            
            {qrSlug ? (
              <div className="space-y-4">
                <EmergencyQR slug={qrSlug} />
                <button 
                  onClick={handleGenerateQR}
                  disabled={generatingQR}
                  className="btn-secondary w-full justify-center"
                >
                  {generatingQR ? <Spinner size="sm" /> : "Update QR Data"}
                </button>
              </div>
            ) : (
              <button 
                onClick={handleGenerateQR}
                disabled={generatingQR}
                className="btn-primary w-full justify-center bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 shadow-emerald-500/25"
              >
                {generatingQR ? <Spinner size="sm" /> : "Generate QR Code"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
