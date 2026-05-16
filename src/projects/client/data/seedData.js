export const CATEGORIES = {
  Business: [
    'Steel Trader', 'Supplier', 'Customer', 'Transporter', 'Broker',
    'Fabricator', 'Machining', 'Gas Agency', 'Scrap Dealer'
  ],
  Professional: [
    'Chartered Accountant (CA)', 'Accountant', 'GST Consultant',
    'Income Tax Consultant', 'Advocate', 'Insurance Advisor',
    'Bank Staff', 'Financial Consultant'
  ],
  Government: [
    'Police Officer', 'GST Officer', 'Income Tax Officer', 'Government Officer'
  ],
  Service: [
    'Crane Repairing', 'CNC Repairing', 'Machine Maintenance',
    'Nozzle Supplier', 'Electrical Contractor', 'Mechanical Contractor'
  ],
  Personal: [
    'Friend', 'Relative', 'Staff', 'Work Staff', 'Personal Contact'
  ]
};

export const JOB_ROLES = [
  'AutoCAD Operator', 'Accountant', 'Sales Executive', 'Marketing Executive',
  'Purchase Executive', 'Store Keeper', 'CNC Operator', 'Machine Operator',
  'Helper', 'Driver'
];

export const STATUS_OPTIONS = ['VIP', 'IMP', 'Favourite', 'Regular', 'Backup', 'Avoid'];

export const MATERIAL_TYPES = [
  'MS Plate', 'SS Plate', 'HR Coil', 'CR Coil', 'Angle', 'Channel',
  'Beam', 'Pipe', 'Tube', 'Round Bar', 'Flat Bar', 'Chequered Plate'
];

export const STEEL_GRADES = [
  'IS 2062 E250', 'IS 2062 E350', 'IS 2062 E410', 'IS 2062 E450',
  'SAILMA 350', 'SAILMA 410', 'SAILMA 450', 'S355JR', 'S235JR',
  'A36', 'A572 Gr50', 'SS 304', 'SS 316', 'SS 202', 'Hardox 400',
  'Hardox 500', 'Corten A', 'Corten B', 'EN8', 'EN24', 'D2', 'H11'
];

export const VEHICLE_TYPES = [
  'Mini Truck', 'LCV (3.5T)', 'Medium Truck (10T)', 'Heavy Truck (20T)',
  'Trailer (40T)', 'Flatbed Trailer', 'Container', 'Tipper', 'Crane'
];

export const DEPARTMENTS = [
  'Production', 'Sales', 'Purchase', 'Accounts', 'Store', 'HR',
  'Dispatch', 'Marketing', 'Admin', 'Quality'
];

export const INTERVIEW_STATUSES = [
  'Pending', 'Scheduled', 'In Progress', 'Selected', 'Rejected', 'On Hold'
];

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Delhi', 'Jammu & Kashmir', 'Ladakh'
];

export const sampleContacts = [
  {
    id: '1',
    companyName: 'Rajesh Steel Traders',
    contactPerson: 'Rajesh Kumar',
    mobile: '9876543210',
    altMobile: '9876543211',
    whatsapp: '9876543210',
    email: 'rajesh@rajeshsteel.com',
    address: '42, Industrial Area, Phase-2',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382210',
    designation: 'Owner',
    department: 'Sales',
    categoryGroup: 'Business',
    category: 'Steel Trader',
    subCategory: 'MS Plates',
    businessType: 'Wholesale',
    steelGrades: ['IS 2062 E250', 'IS 2062 E350'],
    materialType: 'MS Plate',
    serviceType: '',
    workingArea: 'Gujarat, Maharashtra',
    routeCovered: '',
    status: 'VIP',
    rating: 5,
    birthday: '1978-05-15',
    followUpDate: '2026-05-01',
    notes: 'Key supplier for IS 2062 plates.',
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: '2',
    companyName: 'Mehta Transport Co.',
    contactPerson: 'Vikram Mehta',
    mobile: '9823456780',
    altMobile: '',
    whatsapp: '9823456780',
    email: 'vikram@mehtatransport.com',
    address: 'Plot 7, Transport Nagar',
    city: 'Surat',
    state: 'Gujarat',
    pincode: '395003',
    designation: 'Manager',
    department: 'Logistics',
    categoryGroup: 'Business',
    category: 'Transporter',
    subCategory: '',
    businessType: 'Logistics',
    steelGrades: [],
    materialType: '',
    serviceType: 'Heavy Transport',
    workingArea: 'Gujarat',
    routeCovered: 'Surat–Ahmedabad–Mumbai',
    status: 'IMP',
    rating: 4,
    birthday: '1985-11-22',
    followUpDate: '',
    notes: 'Reliable for heavy material transport.',
    createdAt: '2026-01-15T10:00:00Z'
  },
  {
    id: '3',
    companyName: 'Sharma & Associates',
    contactPerson: 'CA Priya Sharma',
    mobile: '9912345678',
    altMobile: '',
    whatsapp: '9912345678',
    email: 'priya@sharmaassociates.com',
    address: '301, Commerce House, Ring Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '380009',
    designation: 'Chartered Accountant',
    department: 'Accounts',
    categoryGroup: 'Professional',
    category: 'Chartered Accountant (CA)',
    subCategory: '',
    businessType: 'Professional Service',
    steelGrades: [],
    materialType: '',
    serviceType: 'GST & Audit',
    workingArea: 'Ahmedabad',
    routeCovered: '',
    status: 'Favourite',
    rating: 5,
    birthday: '1982-08-10',
    followUpDate: '2026-04-30',
    notes: 'Handles all GST returns and audit.',
    createdAt: '2026-01-20T10:00:00Z'
  },
  {
    id: '4',
    companyName: '',
    contactPerson: 'Insp. Ramesh Patel',
    mobile: '9811234567',
    altMobile: '',
    whatsapp: '',
    email: '',
    address: 'Police Station, Naroda',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382330',
    designation: 'Inspector',
    department: 'Police',
    categoryGroup: 'Government',
    category: 'Police Officer',
    subCategory: '',
    businessType: '',
    steelGrades: [],
    materialType: '',
    serviceType: '',
    workingArea: 'Naroda',
    routeCovered: '',
    status: 'IMP',
    rating: 3,
    birthday: '',
    followUpDate: '',
    notes: '',
    createdAt: '2026-02-01T10:00:00Z'
  },
  {
    id: '5',
    companyName: 'National Crane Services',
    contactPerson: 'Suresh Joshi',
    mobile: '9734567890',
    altMobile: '9734567891',
    whatsapp: '9734567890',
    email: 'suresh@nationalcrane.com',
    address: 'GIDC, Vatva',
    city: 'Ahmedabad',
    state: 'Gujarat',
    pincode: '382445',
    designation: 'Technician',
    department: 'Service',
    categoryGroup: 'Service',
    category: 'Crane Repairing',
    subCategory: '',
    businessType: 'Service',
    steelGrades: [],
    materialType: '',
    serviceType: 'Crane Maintenance & Repair',
    workingArea: 'Gujarat',
    routeCovered: '',
    status: 'Regular',
    rating: 4,
    birthday: '1990-03-28',
    followUpDate: '',
    notes: 'Quick response time for breakdowns.',
    createdAt: '2026-02-10T10:00:00Z'
  }
];

export const sampleEmployees = [
  {
    id: 'e1',
    name: 'Arjun Verma',
    department: 'Production',
    skill: 'CNC Programming, AutoCAD',
    experience: '5 years',
    salary: 35000,
    joiningDate: '2022-03-01',
    createdAt: '2022-03-01T10:00:00Z'
  },
  {
    id: 'e2',
    name: 'Sunita Patel',
    department: 'Accounts',
    skill: 'Tally, GST Filing',
    experience: '3 years',
    salary: 22000,
    joiningDate: '2023-06-15',
    createdAt: '2023-06-15T10:00:00Z'
  }
];

export const sampleCandidates = [
  {
    id: 'c1',
    name: 'Rohit Sharma',
    applyingFor: 'CNC Operator',
    department: 'Production',
    qualification: 'ITI (Turner)',
    experience: '2 years',
    expectedSalary: 20000,
    resume: '',
    interviewStatus: 'Scheduled',
    createdAt: '2026-04-10T10:00:00Z'
  }
];
