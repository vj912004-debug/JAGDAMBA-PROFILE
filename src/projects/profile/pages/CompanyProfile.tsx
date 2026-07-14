import React, { useState, useEffect } from 'react';

import { MasterForm } from '../components/MasterForm';

import { useAppContext, DEFAULT_COMPANY_PROFILE } from '../store/AppContext';

import toast from 'react-hot-toast';



export const CompanyProfile: React.FC = () => {

  const { companyProfile, setCompanyProfile, persistErpNow } = useAppContext();

  const [f, setF] = useState(companyProfile || DEFAULT_COMPANY_PROFILE);

  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }));



  useEffect(() => {

    setF(companyProfile || DEFAULT_COMPANY_PROFILE);

  }, [companyProfile]);



  const handleSave = async () => {

    if (!f.name.trim()) { toast.error('Company Name is required'); return; }

    const next = { ...f, name: f.name.trim() };

    setCompanyProfile(next);

    try {

      await persistErpNow({ companyProfile: next });

      toast.success('Company profile saved');

    } catch {

      toast.error('Saved locally but server sync failed — retry Save');

    }

  };



  return (

    <MasterForm

      detailsTitle="Company Profile Details"

      onSave={() => void handleSave()}

      fields={[

        { label: 'Company Name', value: f.name, onChange: set('name'), required: true },

        { label: 'GST No', value: f.gst, onChange: set('gst') },

        { label: 'PAN No', value: f.pan, onChange: set('pan') },

        { label: 'Address', value: f.address, onChange: set('address'), type: 'textarea' },

        { label: 'Mobile', value: f.mobile, onChange: set('mobile') },

        { label: 'Email', value: f.email, onChange: set('email') },

      ]}

    />

  );

};

