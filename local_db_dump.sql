--
-- PostgreSQL database dump
--

-- Dumped from database version 17.0
-- Dumped by pg_dump version 17.0

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: riven
--

CREATE TYPE public."Role" AS ENUM (
    'USER',
    'TA',
    'PROFESSOR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO riven;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Class; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Class" (
    id integer NOT NULL,
    "courseCode" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "classGroup" text DEFAULT 'Unknown'::text NOT NULL,
    "classType" text DEFAULT 'Unknown'::text NOT NULL
);


ALTER TABLE public."Class" OWNER TO riven;

--
-- Name: Class_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."Class_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Class_id_seq" OWNER TO riven;

--
-- Name: Class_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."Class_id_seq" OWNED BY public."Class".id;


--
-- Name: Comment; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Comment" (
    id integer NOT NULL,
    author text NOT NULL,
    content text NOT NULL,
    "ticketId" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "taskId" integer
);


ALTER TABLE public."Comment" OWNER TO riven;

--
-- Name: Comment_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."Comment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Comment_id_seq" OWNER TO riven;

--
-- Name: Comment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."Comment_id_seq" OWNED BY public."Comment".id;


--
-- Name: File; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."File" (
    id integer NOT NULL,
    "fileName" text NOT NULL,
    "ticketId" integer,
    url text NOT NULL,
    "taskId" integer
);


ALTER TABLE public."File" OWNER TO riven;

--
-- Name: File_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."File_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."File_id_seq" OWNER TO riven;

--
-- Name: File_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."File_id_seq" OWNED BY public."File".id;


--
-- Name: Student; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Student" (
    id integer NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "studentCode" text NOT NULL,
    prog text NOT NULL
);


ALTER TABLE public."Student" OWNER TO riven;

--
-- Name: Student_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."Student_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Student_id_seq" OWNER TO riven;

--
-- Name: Student_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."Student_id_seq" OWNED BY public."Student".id;


--
-- Name: Task; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Task" (
    id integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "professorId" integer NOT NULL,
    "taId" integer NOT NULL,
    "dueDate" timestamp(3) without time zone NOT NULL,
    details text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    name text DEFAULT 'Untitled Task'::text NOT NULL
);


ALTER TABLE public."Task" OWNER TO riven;

--
-- Name: Task_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."Task_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Task_id_seq" OWNER TO riven;

--
-- Name: Task_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."Task_id_seq" OWNED BY public."Task".id;


--
-- Name: Ticket; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Ticket" (
    id integer NOT NULL,
    "ticketDescription" text NOT NULL,
    category text NOT NULL,
    priority text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "taId" integer NOT NULL,
    "professorId" integer NOT NULL,
    status text DEFAULT 'open'::text NOT NULL,
    "studentId" integer
);


ALTER TABLE public."Ticket" OWNER TO riven;

--
-- Name: Ticket_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."Ticket_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Ticket_id_seq" OWNER TO riven;

--
-- Name: Ticket_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."Ticket_id_seq" OWNED BY public."Ticket".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    role public."Role" DEFAULT 'USER'::public."Role" NOT NULL
);


ALTER TABLE public."User" OWNER TO riven;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: riven
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO riven;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: riven
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _ClassStudents; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."_ClassStudents" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_ClassStudents" OWNER TO riven;

--
-- Name: _TaskClasses; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."_TaskClasses" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_TaskClasses" OWNER TO riven;

--
-- Name: _TicketClasses; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."_TicketClasses" (
    "A" integer NOT NULL,
    "B" integer NOT NULL
);


ALTER TABLE public."_TicketClasses" OWNER TO riven;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO riven;

--
-- Name: Class id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Class" ALTER COLUMN id SET DEFAULT nextval('public."Class_id_seq"'::regclass);


--
-- Name: Comment id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment" ALTER COLUMN id SET DEFAULT nextval('public."Comment_id_seq"'::regclass);


--
-- Name: File id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."File" ALTER COLUMN id SET DEFAULT nextval('public."File_id_seq"'::regclass);


--
-- Name: Student id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Student" ALTER COLUMN id SET DEFAULT nextval('public."Student_id_seq"'::regclass);


--
-- Name: Task id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task" ALTER COLUMN id SET DEFAULT nextval('public."Task_id_seq"'::regclass);


--
-- Name: Ticket id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket" ALTER COLUMN id SET DEFAULT nextval('public."Ticket_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Class; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Class" (id, "courseCode", "createdAt", "updatedAt", "classGroup", "classType") FROM stdin;
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Comment" (id, author, content, "ticketId", "createdAt", "taskId") FROM stdin;
\.


--
-- Data for Name: File; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."File" (id, "fileName", "ticketId", url, "taskId") FROM stdin;
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Student" (id, name, "createdAt", "studentCode", prog) FROM stdin;
1	CHUA LI TING	2025-01-19 06:13:23.987	CHUL6789	CSC3 FT
2	CHUA XIN YI	2025-01-19 06:13:24.002	CHUX6789	CSC3 FT
3	GOH KAI TING	2025-01-19 06:13:24.004	GOHK4567	DSAI3 FT
4	GOH WEI LING	2025-01-19 06:13:24.007	GOHW4567	CSC3 FT
5	KOH KAI XUAN	2025-01-19 06:13:24.009	KOHK2345	CSC3 FT
6	KOH MEI LING	2025-01-19 06:13:24.011	KOHM2345	DSAI3 FT
7	LEE HYUNSUN	2025-01-19 06:13:24.015	LEEH9898	DSAI3 FT
8	LEE JIA YI	2025-01-19 06:13:24.017	LEEJ5432	CSC3 FT
9	LEE WEI XUAN	2025-01-19 06:13:24.02	LEEW5432	DSAI3 FT
10	LEE XIN YI	2025-01-19 06:13:24.022	LEEX5432	CSC3 FT
11	LIM HUI TING	2025-01-19 06:13:24.024	LIMH5678	DSAI3 FT
12	LIM WEI CHEN	2025-01-19 06:13:24.026	LIMW1234	CSC3 FT
13	LIM XIN TING	2025-01-19 06:13:24.029	LIMX5678	CSC3 FT
14	NG JIA MIN	2025-01-19 06:13:24.032	NGJI9876	DSAI3 FT
15	NG KAI WEI	2025-01-19 06:13:24.036	NGKA9876	CSC3 FT
16	NG LI WEI	2025-01-19 06:13:24.042	NGLI9876	CSC4 FT
17	NGUYEN HOANG NHAT	2025-01-19 06:13:24.045	NGUY0012	CSC3 FT
18	ONG WEI LING	2025-01-19 06:13:24.047	ONGW3210	DSAI4 FT
19	TAN JIA LING	2025-01-19 06:13:24.053	TANJ4321	DSAI3 FT
20	TAN KAI LING	2025-01-19 06:13:24.055	TANK4321	CSC3 FT
21	TAN WEI LING	2025-01-19 06:13:24.057	TANW5678	CSC3 FT
22	TAY HUI MIN	2025-01-19 06:13:24.06	TAYH7654	CSC3 FT
23	TAY LI WEI	2025-01-19 06:13:24.064	TAYL7654	CSC3 FT
24	WONG HUI MIN	2025-01-19 06:13:24.069	WONH7890	CSC3 FT
25	WONG MEI CHEN	2025-01-19 06:13:24.072	WONM7890	CSC3 FT
26	YAP KAI WEI	2025-01-19 06:13:24.075	YAPK9087	DSAI3 FT
27	YAP WEN LI	2025-01-19 06:13:24.078	YAPW9087	CSC3 FT
28	BENJAMIN SANTOS	2025-01-19 06:13:24.082	BENST129	CSC3 FT
29	CHUA JIA LING	2025-01-19 06:13:24.085	CHUJ6789	CSC4 FT
30	CHUA YU TING	2025-01-19 06:13:24.088	CHUY1234	REP3 FT
31	CHUA WEN LI	2025-01-19 06:13:24.09	CHUW6789	DSAI3 FT
32	GOH XIN TING	2025-01-19 06:13:24.095	GOHX4567	ACDA3 FT
33	JOHN SMITH	2025-01-19 06:13:24.099	R12115452G	 Exchange
34	JOSEPHINE KURNIAWAN	2025-01-19 06:13:24.102	JOSEPHI09	CSC3 FT
35	KOH HUI TING	2025-01-19 06:13:24.104	KOHU2345	CSC3 FT
36	KOH LI WEI	2025-01-19 06:13:24.106	KOHL2345	CSC3 FT
37	LEE KAI WEI	2025-01-19 06:13:24.109	LEEK5432	CSC3 FT
38	LIM LI TING	2025-01-19 06:13:24.111	LIML5678	CSC3 FT
39	LIM MEI CHEN	2025-01-19 06:13:24.114	LIMM5678	CSC3 FT
40	NAKAMURA HARUKI	2025-01-19 06:13:24.117	T67516625Y	 Exchange
41	NG WEI LING	2025-01-19 06:13:24.119	NGWL9876	CSC4 FT
42	ONG HUI MIN	2025-01-19 06:13:24.121	ONGH3210	CSC3 FT
43	ONG XIN YI	2025-01-19 06:13:24.124	ONGX3210	CSC3 FT
44	PHAN HOANG TRAN	2025-01-19 06:13:24.127	PHHOANG1827	CSC3 FT
45	TAN XIN YI	2025-01-19 06:13:24.131	TANX4321	CSC4 FT
46	WONG JIA MIN	2025-01-19 06:13:24.136	WONJ7890	DSAI3 FT
47	WONG WEI XUAN	2025-01-19 06:13:24.139	WONW7890	CSC3 FT
48	YAP MEI TING	2025-01-19 06:13:24.141	YAPM9087	CSC3 FT
49	ARJUN PATEL	2025-01-19 06:13:24.148	PATELAR14	DSAI3 FT
50	LEE HUI TING	2025-01-19 06:13:24.157	LEEH5432	CSC3 FT
51	LI XINYI	2025-01-19 06:13:24.16	LIXI5432	CSC3 FT
52	NG KAI LING	2025-01-19 06:13:24.165	NGKL9876	DSAI3 FT
53	NG WEI XUAN	2025-01-19 06:13:24.167	NGWX9876	CSC3 FT
54	ONG KAI WEI	2025-01-19 06:13:24.169	ONGK3210	CSC3 FT
55	TAN LI WEI	2025-01-19 06:13:24.171	TANL4321	DSAI3 FT
56	TAY JIA LING	2025-01-19 06:13:24.174	TAYJ7654	CSC3 FT
57	YAP XIN TING	2025-01-19 06:13:24.176	YAPX9087	DSAI4 FT
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Task" (id, "createdAt", "professorId", "taId", "dueDate", details, status, name) FROM stdin;
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Ticket" (id, "ticketDescription", category, priority, "createdAt", "updatedAt", "taId", "professorId", status, "studentId") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."User" (id, name, email, "createdAt", role) FROM stdin;
4	Prof Aloysius	aloysius@gmail.com	2025-01-19 06:15:40.694	PROFESSOR
5	bryan tay	rivenbryan@gmail.com	2025-01-19 06:17:16.552	TA
2	admin	tafaculty2025@gmail.com	2025-01-19 06:08:51.203	ADMIN
\.


--
-- Data for Name: _ClassStudents; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."_ClassStudents" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _TaskClasses; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."_TaskClasses" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _TicketClasses; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."_TicketClasses" ("A", "B") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
17972a51-ba29-49ec-b828-54719a9efec2	0c9ad546f7977f001a9e9b48c3bfbc6100d831db6916e5e655efe98b33de4fca	2025-01-19 14:04:46.737188+08	20241022024520_init	\N	\N	2025-01-19 14:04:46.726196+08	1
e8f02966-2bad-41ae-b36c-f8a1359ab84f	9c24bbd23c307a6844721743de00f80ed6038a65bfda8c28208d1c6fb61c3bff	2025-01-19 14:04:46.841196+08	20241113060016_remove_ticket_number	\N	\N	2025-01-19 14:04:46.839567+08	1
65a830f4-6fed-48ac-8670-7fbaea282746	802f29aaa4a40f58f02b8d7e7ff51f0d3d200901059efe04cd425787d26c0598	2025-01-19 14:04:46.740179+08	20241023032528_add_role_to_user	\N	\N	2025-01-19 14:04:46.737908+08	1
1198f538-0b99-4fcf-af5e-adf51b5f6dde	440f7c4858200c66b4d31baa572b46400039ba10275b4af7bb77020972780692	2025-01-19 14:04:46.743064+08	20241023033529_add_ta_prof	\N	\N	2025-01-19 14:04:46.740942+08	1
701d15ce-6f88-4740-9cb9-f258d22be246	67f74e3d96e9d359b56272465183a9b7d5c5d688650141147808551fa13e2850	2025-01-19 14:04:46.886552+08	20241228083844_	\N	\N	2025-01-19 14:04:46.884809+08	1
f740c39e-6d5d-43ee-942f-c128a8a480bb	03c256c3f54ccd49590ee9bc4c0a522313646133d5da56a6a6841e72cc87bcb5	2025-01-19 14:04:46.774525+08	20241023034630_add_ticket_user_relation	\N	\N	2025-01-19 14:04:46.743737+08	1
670e234b-a407-4a88-8c2c-a723b4919472	71efe74f2fe3ff893fa08fd98a8fa28d68f42fc7c7bec49d36f3cfe5cf5b2a14	2025-01-19 14:04:46.84619+08	20241113061016_remove_ticket_number	\N	\N	2025-01-19 14:04:46.842022+08	1
af86f35f-8345-4d53-9735-727090ece5d0	d6efc5213794b01d5ededed97ba7fe16fb61452336c1d68a0e1599242d99824b	2025-01-19 14:04:46.785691+08	20241023095208_add_ticket_files	\N	\N	2025-01-19 14:04:46.775416+08	1
c0c7dfc8-67db-4059-afd7-d5bc1a13f7da	088689fcc94ca8cde4483c4e2299c8ab0924127b7edc7576ffa95584700ca559	2025-01-19 14:04:46.788357+08	20241023101653_add	\N	\N	2025-01-19 14:04:46.786287+08	1
678df236-d65f-4066-bbf2-2f40f82d3f32	ff1a272273547efd520b5c966b1953f229d43d6cd2dd3e733d3cafe959bdef78	2025-01-19 14:04:46.790865+08	20241023113459_add_ticket_status	\N	\N	2025-01-19 14:04:46.789266+08	1
37b9c7df-957d-4ceb-8314-3cc04234710e	0b9952403cdb8ed1530d1f703b1bf16a7a0de681a238c69e26924922391bdcbc	2025-01-19 14:04:46.850752+08	20241113061047_remove_ticket_number	\N	\N	2025-01-19 14:04:46.847186+08	1
4dcbf5fa-2672-492f-9da9-72305dc7b53f	0ae3182490f64ad09b65e167115dad2224a61699b71878e3c6a8f3f38556f40a	2025-01-19 14:04:46.80412+08	20241023122830_tasks	\N	\N	2025-01-19 14:04:46.791504+08	1
2366f0f6-3a1c-4c16-b865-195138763d98	f18ee182868a08b9288a0594527a2e4a7f21aebd0fbe47fbb4f16c94cfd28ec6	2025-01-19 14:04:46.806909+08	20241024035618_add_task_name_field	\N	\N	2025-01-19 14:04:46.80484+08	1
b4651bf2-a742-4834-b5fc-6eef1f53d1a5	6217864b935637f9c310acd7d9f169f8e64bc05b86c155ac7d4719fa3c4cabe6	2025-01-19 14:04:46.826505+08	20241113050507_make_class_id_optional	\N	\N	2025-01-19 14:04:46.807811+08	1
36d20ef4-c389-4987-82da-3dbdbffd56fc	39687cb2262ae337bee0b3b815ddcd34d483d0267d017e661c067e4d386bebcf	2025-01-19 14:04:46.85466+08	20241122072622_add_course_name_to_class	\N	\N	2025-01-19 14:04:46.85148+08	1
a7139e3a-36ee-4561-b6da-44e3e07edcc3	5a76b2c9bbaaa2d5ec153f1a09a99cc331cec15a49b67cf9d5332a0dc119fbb6	2025-01-19 14:04:46.831404+08	20241113051433_update_student_schema	\N	\N	2025-01-19 14:04:46.827295+08	1
c62a66d4-bfdf-4a53-9a2a-7b5e8119a58e	6da6aee250847efeda274d1110045cf6e7d04a9556f7639a6bdb6bba5dc657fd	2025-01-19 14:04:46.835013+08	20241113052140_link_ticket_to_student	\N	\N	2025-01-19 14:04:46.832026+08	1
4e889176-3b1d-41bc-b7c2-84b0c02af076	0f4380614d3a5c4c98b1302d12b23b8d575b95e195d3dd2a4cc15bbd1264f0c8	2025-01-19 14:04:46.895105+08	20241230095850_	\N	\N	2025-01-19 14:04:46.887186+08	1
dd3b43c5-562d-4684-bb71-1df4252a9f36	0b9952403cdb8ed1530d1f703b1bf16a7a0de681a238c69e26924922391bdcbc	2025-01-19 14:04:46.83888+08	20241113055735_remove_ticket_number	\N	\N	2025-01-19 14:04:46.835575+08	1
82bc22e1-c2bd-441a-b275-a4e66c786904	f341a3c0ae39d68649d316970e27ee1eac8d0f4f98ce1d303ff0bb2b09d30805	2025-01-19 14:04:46.858845+08	20241122080430_add_student_code	\N	\N	2025-01-19 14:04:46.855403+08	1
7e1f9458-5900-49e3-8b74-72842398d4c2	2d251c9fa1cf338491bc624c27e82f23258057be81823443133325d467819cb2	2025-01-19 14:04:46.870549+08	20241122082233_rename	\N	\N	2025-01-19 14:04:46.85953+08	1
fd0a147e-293c-41d8-81d0-6df5a7275a0a	0f46f214559d7c7dee562c60b89e82ba3dae6981fb201ae827a7a61e5073337b	2025-01-19 14:04:46.876427+08	20241228082319_	\N	\N	2025-01-19 14:04:46.871101+08	1
fa5035cf-7375-411d-b2b0-dd3bd4f33d1c	2b02ead6384ad2130ffea2b9249d8352e41a02fd5a854658cfd0cff795746cf0	2025-01-19 14:04:46.9037+08	20250102041435_	\N	\N	2025-01-19 14:04:46.895845+08	1
a36cef04-9765-498a-aaa8-0c712eeb278a	a376d4a7b3d419bdd27461c1e2cf95592475fdc979998188b1da8a2d437a2f77	2025-01-19 14:04:46.881255+08	20241228082537_	\N	\N	2025-01-19 14:04:46.877309+08	1
10245b59-e605-4092-819b-a48c2a1ce9ea	f6ba453c87c766c70f513161f51355ba51157695bfba897438bede16a3f24801	2025-01-19 14:04:46.884065+08	20241228083616_	\N	\N	2025-01-19 14:04:46.882214+08	1
c6abb694-4e93-4a78-9815-a18dfcc3dcf8	c482d03357c1c7c3bf83dc17f569d3a1b5ceb41fcffd048fe8025b45e221a12b	2025-01-19 14:04:48.459356+08	20250119060448_add_cascade_delete	\N	\N	2025-01-19 14:04:48.448795+08	1
\.


--
-- Name: Class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Class_id_seq"', 7, true);


--
-- Name: Comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Comment_id_seq"', 1, false);


--
-- Name: File_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."File_id_seq"', 1, false);


--
-- Name: Student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Student_id_seq"', 57, true);


--
-- Name: Task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Task_id_seq"', 1, false);


--
-- Name: Ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Ticket_id_seq"', 1, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."User_id_seq"', 5, true);


--
-- Name: Class Class_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Class"
    ADD CONSTRAINT "Class_pkey" PRIMARY KEY (id);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


--
-- Name: File File_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_pkey" PRIMARY KEY (id);


--
-- Name: Student Student_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Student"
    ADD CONSTRAINT "Student_pkey" PRIMARY KEY (id);


--
-- Name: Task Task_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_pkey" PRIMARY KEY (id);


--
-- Name: Ticket Ticket_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Student_studentCode_key; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "Student_studentCode_key" ON public."Student" USING btree ("studentCode");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: _ClassStudents_AB_unique; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "_ClassStudents_AB_unique" ON public."_ClassStudents" USING btree ("A", "B");


--
-- Name: _ClassStudents_B_index; Type: INDEX; Schema: public; Owner: riven
--

CREATE INDEX "_ClassStudents_B_index" ON public."_ClassStudents" USING btree ("B");


--
-- Name: _TaskClasses_AB_unique; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "_TaskClasses_AB_unique" ON public."_TaskClasses" USING btree ("A", "B");


--
-- Name: _TaskClasses_B_index; Type: INDEX; Schema: public; Owner: riven
--

CREATE INDEX "_TaskClasses_B_index" ON public."_TaskClasses" USING btree ("B");


--
-- Name: _TicketClasses_AB_unique; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "_TicketClasses_AB_unique" ON public."_TicketClasses" USING btree ("A", "B");


--
-- Name: _TicketClasses_B_index; Type: INDEX; Schema: public; Owner: riven
--

CREATE INDEX "_TicketClasses_B_index" ON public."_TicketClasses" USING btree ("B");


--
-- Name: Comment Comment_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Comment Comment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: File File_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: File File_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."File"
    ADD CONSTRAINT "File_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_professorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Task Task_taId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_taId_fkey" FOREIGN KEY ("taId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_professorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ticket Ticket_taId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_taId_fkey" FOREIGN KEY ("taId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClassStudents _ClassStudents_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."_ClassStudents"
    ADD CONSTRAINT "_ClassStudents_A_fkey" FOREIGN KEY ("A") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _ClassStudents _ClassStudents_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."_ClassStudents"
    ADD CONSTRAINT "_ClassStudents_B_fkey" FOREIGN KEY ("B") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TaskClasses _TaskClasses_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."_TaskClasses"
    ADD CONSTRAINT "_TaskClasses_A_fkey" FOREIGN KEY ("A") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TaskClasses _TaskClasses_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."_TaskClasses"
    ADD CONSTRAINT "_TaskClasses_B_fkey" FOREIGN KEY ("B") REFERENCES public."Task"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TicketClasses _TicketClasses_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."_TicketClasses"
    ADD CONSTRAINT "_TicketClasses_A_fkey" FOREIGN KEY ("A") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _TicketClasses _TicketClasses_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."_TicketClasses"
    ADD CONSTRAINT "_TicketClasses_B_fkey" FOREIGN KEY ("B") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO riven;


--
-- PostgreSQL database dump complete
--

