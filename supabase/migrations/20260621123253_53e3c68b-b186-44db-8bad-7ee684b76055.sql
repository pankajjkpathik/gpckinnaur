
-- Departments
CREATE TABLE public.departments (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) NOT NULL,
  description TEXT,
  image VARCHAR(500)
);
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Faculty
CREATE TABLE public.faculty (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  designation VARCHAR(100),
  department_id INTEGER REFERENCES public.departments(id),
  qualification VARCHAR(200),
  email VARCHAR(100),
  experience VARCHAR(50),
  image VARCHAR(500)
);
GRANT ALL ON public.faculty TO service_role;
ALTER TABLE public.faculty ENABLE ROW LEVEL SECURITY;

-- Notices
CREATE TABLE public.notices (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  content TEXT,
  date TIMESTAMPTZ DEFAULT now(),
  category VARCHAR(50) DEFAULT 'general',
  link VARCHAR(500)
);
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;

-- Events
CREATE TABLE public.events (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  date TIMESTAMPTZ,
  location VARCHAR(200),
  image VARCHAR(500)
);
GRANT ALL ON public.events TO service_role;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Staff users
CREATE TABLE public.staff_users (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  department VARCHAR(50),
  staff_id INTEGER,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.staff_users TO service_role;
ALTER TABLE public.staff_users ENABLE ROW LEVEL SECURITY;

-- Students
CREATE TABLE public.students (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  enrollment_no VARCHAR(20) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100) NOT NULL,
  father_name VARCHAR(100),
  branch VARCHAR(50) NOT NULL,
  semester INTEGER NOT NULL,
  batch_year INTEGER NOT NULL,
  phone VARCHAR(15),
  email VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

-- Study materials
CREATE TABLE public.study_materials (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  type VARCHAR(20) NOT NULL,
  department VARCHAR(50),
  semester INTEGER,
  subject VARCHAR(100),
  file_url VARCHAR(500) NOT NULL,
  uploaded_by INTEGER REFERENCES public.staff_users(id),
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.study_materials TO service_role;
ALTER TABLE public.study_materials ENABLE ROW LEVEL SECURITY;

-- Contact submissions
CREATE TABLE public.contact_submissions (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(100),
  phone VARCHAR(15),
  subject VARCHAR(100),
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.contact_submissions TO service_role;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Alumni registrations
CREATE TABLE public.alumni_registrations (
  id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(100),
  father_name VARCHAR(100),
  branch VARCHAR(50),
  batch_year INTEGER,
  date_of_birth VARCHAR(20),
  profile_type VARCHAR(50),
  designation_sector VARCHAR(100),
  salary_package VARCHAR(50),
  phone VARCHAR(15),
  email VARCHAR(100),
  present_address TEXT,
  is_verified BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
GRANT ALL ON public.alumni_registrations TO service_role;
ALTER TABLE public.alumni_registrations ENABLE ROW LEVEL SECURITY;

-- ============= SEED =============

INSERT INTO public.departments (name, code, description) VALUES
('Civil Engineering','CE','Diploma in Civil Engineering — 3 year program'),
('Mechanical Engineering','ME','Diploma in Mechanical Engineering — 3 year program');

INSERT INTO public.faculty (name, designation, department_id, qualification, experience) VALUES
('Sh. Pankaj K. Pathik','Principal',NULL,'MCA, CCNA','15+ yrs'),
('Er. Punit Sharma','HOD, Civil Engineering',1,'B.Tech Civil','13+ yrs'),
('Er. Manoj Negi','Lecturer',1,'M.Tech Civil','6+ yrs'),
('Er. Akshay Rana','Sr. Lecturer, HOD Mechanical',2,'B.Tech Mechanical','13+ yrs'),
('Er. Rohit Tiwari','Lecturer',2,'M.Tech Manufacturing','6+ yrs'),
('Er. Pankaj Chatanta','Lecturer (SWF)',2,'B.Tech Mechanical','10+ yrs'),
('Sh. Surya Negi','Lecturer',NULL,'M.Sc Chemistry','8+ yrs'),
('Sh. Ravinder Kumar','Lecturer',NULL,'M.Sc Mathematics','8+ yrs'),
('Ms. Amonika','Lecturer',NULL,'M.Phil English','5+ yrs');

INSERT INTO public.notices (title, category, content) VALUES
('Admission Open 2024-25','admission','Applications invited for Diploma programs in Civil and Mechanical Engineering.'),
('Scholarship Form Last Date','scholarship','Students are advised to submit scholarship forms before 30th November 2024.'),
('Practical Examination Schedule','exam','Practical examinations for 3rd and 5th semester will begin from 15th December 2024.'),
('Annual Function Notice','event','Annual cultural function will be held on 20th January 2025 at college premises.'),
('Anti-Ragging Committee Meeting','general','All committee members are requested to attend the meeting on 5th December 2024.');

INSERT INTO public.staff_users (username, password_hash, role, department) VALUES
('admin','$2b$12$H0Zf3EiZxB6MVOtgZ1dVkOM7W6.31673P2CDa4vAicmFbamJAKAgC','super_admin',NULL),
('principal','$2b$12$H0Zf3EiZxB6MVOtgZ1dVkOM7W6.31673P2CDa4vAicmFbamJAKAgC','principal',NULL),
('punit','$2b$12$Y4XkJcWF4kK2/iX2ALCWle5hcVTuxTqLjie60oD5grgJcGna0WftC','hod','civil'),
('akshay','$2b$12$HDuKrPPd29zVqHKj1P9r.uZrL48sdfk5qK0oAFoaWJ0.xn4fydRFO','hod','mechanical'),
('manoj','$2b$12$dImkaf9wV1rOMYnjR8qu0Om1tl1QgPUHl4Hfzqnz8cbqGeN3mPv/O','faculty','civil'),
('rohit','$2b$12$dImkaf9wV1rOMYnjR8qu0Om1tl1QgPUHl4Hfzqnz8cbqGeN3mPv/O','faculty','mechanical'),
('pankajc','$2b$12$dImkaf9wV1rOMYnjR8qu0Om1tl1QgPUHl4Hfzqnz8cbqGeN3mPv/O','faculty','mechanical'),
('surya','$2b$12$dImkaf9wV1rOMYnjR8qu0Om1tl1QgPUHl4Hfzqnz8cbqGeN3mPv/O','faculty','applied_science'),
('clerk','$2b$12$vyI2pSkENgdHn6k0cK82YOuECFe64RHom4OfV5530gNkW9ddggewK','admin_staff',NULL);

INSERT INTO public.students (enrollment_no, password_hash, name, branch, semester, batch_year) VALUES
('2023CS001','$2b$12$oy4ZkQMy./wLWtFrjH05PeCQZdP3JE36oj3wZ0y0edfQ2mmI5meZC','Rahul Thakur','civil',3,2023),
('2023CS002','$2b$12$oy4ZkQMy./wLWtFrjH05PeCQZdP3JE36oj3wZ0y0edfQ2mmI5meZC','Priya Sharma','civil',3,2023),
('2023ME001','$2b$12$oy4ZkQMy./wLWtFrjH05PeCQZdP3JE36oj3wZ0y0edfQ2mmI5meZC','Amit Rana','mechanical',3,2023),
('2023ME002','$2b$12$oy4ZkQMy./wLWtFrjH05PeCQZdP3JE36oj3wZ0y0edfQ2mmI5meZC','Vijay Kumar','mechanical',3,2023),
('2022CS001','$2b$12$YRyfrc.z1v7hW/b/Cn2avOxHVU2ZQKKVVGGraINxELvV2BUTvRcf2','Sunita Devi','civil',5,2022),
('2022ME001','$2b$12$YRyfrc.z1v7hW/b/Cn2avOxHVU2ZQKKVVGGraINxELvV2BUTvRcf2','Deepak Negi','mechanical',5,2022);
