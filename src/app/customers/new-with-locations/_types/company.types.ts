// Types for the new company-based customer form
export interface ContactPerson {
  name?: string;
  designation?: string;
  phoneNumber?: string;
  emailId?: string;
  isPrimary: boolean;
}

export interface Address {
  address?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface Office extends Address {
  name?: string;
  contacts: ContactPerson[];
}

export interface Plant extends Address {
  name?: string;
  contacts: ContactPerson[];
}

export interface CompanyFormData {
  companyName?: string;
  offices?: Office[];
  plants?: Plant[];
  // Purchase Order fields
  poRuptureDiscs: boolean;
  poThermowells: boolean;
  poHeatExchanger: boolean;
  poMiscellaneous: boolean;
  poWaterJetSteamJet: boolean;
}
