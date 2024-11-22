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
    'PROFESSOR'
);


ALTER TYPE public."Role" OWNER TO riven;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Class; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Class" (
    id integer NOT NULL,
    "courseName" text NOT NULL,
    "courseCode" text NOT NULL,
    "groupCode" text NOT NULL,
    "groupType" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
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
    year integer NOT NULL,
    "studentCode" text NOT NULL
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
    name text DEFAULT 'Untitled Task'::text NOT NULL,
    "classId" integer
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
    "classId" integer,
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

COPY public."Class" (id, "courseName", "courseCode", "groupCode", "groupType", "createdAt", "updatedAt") FROM stdin;
1	Introduction to Computer Science	CS101	A1	Lecture	2022-04-26 00:00:00	2024-09-02 00:00:00
2	Advanced Mathematics	MATH201	B1	Tutorial	2021-07-10 00:00:00	2024-02-02 00:00:00
3	Physics I	PHYS101	C1	Lab	2022-01-26 00:00:00	2024-04-21 00:00:00
4	Organic Chemistry	CHEM202	A1	Lecture	2023-09-13 00:00:00	2024-01-10 00:00:00
5	World History	HIST101	B2	Tutorial	2021-08-30 00:00:00	2024-09-24 00:00:00
14	Introduction to Biology	BIO101	B1	Lecture	2024-11-22 08:36:13.252	2024-11-22 08:36:13.252
15	English Literature	ENG102	C2	Tutorial	2024-11-22 08:36:13.256	2024-11-22 08:36:13.256
16	Modern History	HIST202	A3	Lab	2024-11-22 08:36:13.257	2024-11-22 08:36:13.257
17	Advanced Organic Chemistry	CHEM301	B4	Lecture	2024-11-22 08:36:13.259	2024-11-22 08:36:13.259
18	Quantum Physics	PHYS302	C5	Lab	2024-11-22 08:36:13.26	2024-11-22 08:36:13.26
19	test	test	C2	TEST	2024-11-22 08:36:13.261	2024-11-22 08:36:13.261
20	test123	test123	c1	test123	2024-11-22 08:36:13.262	2024-11-22 08:36:13.262
21	test123	test123	c123	test	2024-11-22 08:36:13.263	2024-11-22 08:36:13.263
\.


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Comment" (id, author, content, "ticketId", "createdAt", "taskId") FROM stdin;
1	Professor Victor	The student mentioned that their upload gets stuck at 90%. Can you check the file size limit or any potential server issue?	28	2024-10-23 16:50:56.935	\N
2	BTAY013	Yup, there is a potential issue	28	2024-10-23 16:51:23.589	\N
3	Professor Victor	What is the issue about?	28	2024-10-23 08:56:56.858	\N
4	BTAY013	test	10	2024-10-23 09:03:03.603	\N
5	BTAY013	red	10	2024-10-23 09:06:39.003	\N
6	BTAY013	It is about how the person didnt do work	28	2024-10-23 09:10:07.41	\N
7	Professor Victor	Okay, why did he not do work?	28	2024-10-23 09:10:27.721	\N
8	BTAY013	hey	28	2024-10-23 09:28:19.633	\N
9	Professor Victor	red	28	2024-10-23 09:28:28.288	\N
10	BTAY013	red	28	2024-10-23 09:55:28.531	\N
11	BTAY013	test	41	2024-10-24 03:19:20.516	\N
12	BTAY013	red	\N	2024-10-24 04:15:47.18	2
13	BTAY013	red	\N	2024-10-24 04:16:32.769	2
14	BTAY013	abc	\N	2024-10-24 04:17:55.022	2
15	BTAY013	red	\N	2024-10-24 04:20:28.064	2
16	Professor Victor	gaesga	\N	2024-10-24 04:20:36.357	2
17	Professor Victor	red	\N	2024-10-24 05:39:52.439	14
18	BTAY013	hey	10	2024-11-13 06:34:13.146	\N
19	BTAY013	red	11	2024-11-13 06:39:49.632	\N
20	BTAY013	hehehe	48	2024-11-13 06:40:49.215	\N
21	BTAY013	heheheh	51	2024-11-13 06:41:17.126	\N
22	Professor Victor	red	56	2024-11-22 08:38:06.159	\N
23	BTAY013	test	56	2024-11-22 08:38:10.141	\N
\.


--
-- Data for Name: File; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."File" (id, "fileName", "ticketId", url, "taskId") FROM stdin;
2	main_resume_v2.docx	30	https://blobstorageta.blob.core.windows.net/medical-certificates/85d54dd5-6af4-429f-aebc-f5203ba74b9f-main_resume_v2.docx?sv=2024-11-04&st=2024-10-23T10%3A24%3A53Z&se=2024-10-23T11%3A24%3A53Z&sr=b&sp=r&sig=6A2596VnS4J3JGCVwrBLcEbtH9ZE98kQ9I%2B9iZ%2FLhQM%3D	\N
4	main_resume_v3.docx	32	https://blobstorageta.blob.core.windows.net/medical-certificates/2c3baba7-ea04-467a-af70-6006d7ba4970-main_resume_v3.docx?sv=2024-11-04&st=2024-10-23T10%3A26%3A47Z&se=2024-10-23T11%3A26%3A47Z&sr=b&sp=r&sig=28E7j439%2FDcPoA6fgT9wVvpSwmp89%2FrN6IWbt2zBhwI%3D	\N
6	main_resume.docx	34	https://blobstorageta.blob.core.windows.net/blobstorageta/609361fa-bc7a-48f4-b2a7-3b85285d88ea-main_resume.docx?sv=2024-11-04&st=2024-10-23T11%3A37%3A42Z&se=2024-10-23T12%3A37%3A42Z&sr=b&sp=r&sig=xw1JebwWakENqSq9KB9Gdw17ApNXWDK4UcWdHxZpd%2Fg%3D	\N
7	main_resume.docx	35	https://blobstorageta.blob.core.windows.net/blobstorageta/066cfafa-2de3-492d-9f0a-be46c980078b-main_resume.docx?sv=2024-11-04&st=2024-10-23T11%3A42%3A29Z&se=2024-10-23T12%3A42%3A29Z&sr=b&sp=r&sig=kpvboHyXb6DM1T2D8qmLhseMgjrhJIvmPtMQ%2FYP6b4Y%3D	\N
8	main_resume_v3.docx	37	https://blobstorageta.blob.core.windows.net/blobstorageta/dd11be21-ee21-4a47-b7f9-656160c6c363-main_resume_v3.docx?sv=2024-11-04&st=2024-10-23T11%3A44%3A00Z&se=2024-10-23T12%3A44%3A00Z&sr=b&sp=r&sig=F6OVOTdR7nEcL0SVwvPlDPGUlcoOMWi5qoUKZuAHXrM%3D	\N
9	main_resume.docx	38	https://blobstorageta.blob.core.windows.net/blobstorageta/70a0532b-c604-474c-9bd5-be1c0c8b429d-main_resume.docx?sv=2024-11-04&st=2024-10-23T11%3A46%3A12Z&se=2024-10-23T12%3A46%3A12Z&sr=b&sp=r&sig=c8SGFB4hKFsDIZARPPNEkveQ%2B3pCqmeIIjRw01lkQe8%3D	\N
10	main_resume_v3.docx	40	https://blobstorageta.blob.core.windows.net/blobstorageta/9f9278b9-0821-4fc5-83e6-b98d8adb344f-main_resume_v3.docx?sv=2024-11-04&st=2024-10-23T12%3A08%3A01Z&se=2024-10-23T13%3A08%3A01Z&sr=b&sp=r&sig=ykcV6bpL3WQYRJL%2BYA7mjk3dwWKAc6%2F%2FTAPG%2FR8Yg%2Bg%3D	\N
11	main_resume_v3.docx	41	https://blobstorageta.blob.core.windows.net/blobstorageta/9632c652-5a4d-4269-9175-4f01d8e963e3-main_resume_v3.docx?sv=2024-11-04&st=2024-10-24T03%3A19%3A16Z&se=2024-10-24T04%3A19%3A16Z&sr=b&sp=r&sig=UKkWwZEbxqzm6913kfmclcKiA9XcIIOFFpbeRPCWfwY%3D	\N
12	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/blobstorageta/00edb6e1-47cd-45f6-8b62-dcc37c127f33-main_resume.docx?sv=2024-11-04&st=2024-10-24T03%3A29%3A47Z&se=2024-10-24T04%3A29%3A47Z&sr=b&sp=r&sig=lo33XHRmvpvRap3RCng0FiprTbPeqmyCyaG737pm37Y%3D	2
13	main_resume_v3.pdf	\N	https://blobstorageta.blob.core.windows.net/blobstorageta/2b9b01f8-375f-4059-a06c-d70b74f62802-main_resume_v3.pdf?sv=2024-11-04&st=2024-10-24T03%3A38%3A00Z&se=2024-10-24T04%3A38%3A00Z&sr=b&sp=r&sig=ZdVpTTG0jQkP%2BG7mNlJFsckk13EjGYcZF8QlEQHWaIA%3D	3
14	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/blobstorageta/002e42bc-0472-41ad-82c8-6bdbe8d723a9-main_resume.docx?sv=2024-11-04&st=2024-10-24T03%3A41%3A13Z&se=2024-10-24T04%3A41%3A13Z&sr=b&sp=r&sig=Tqo7%2FE2RBqkxBXrw92iNJ8UC9bzTGDAEPEzEpMNl0hY%3D	5
15	main_resume_v3.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729742857082-main_resume_v3.docx	7
16	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729742950393-main_resume.docx	9
17	main_resume_v3.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729743779551-main_resume_v3.docx	11
18	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729745705576-main_resume.docx	14
19	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729746155198-main_resume.docx	15
20	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729746160209-main_resume.docx	16
21	main_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729746684873-main_resume.docx	25
22	main_resume_v3.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729747235307-main_resume_v3.docx	29
23	main_resume_v3.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729747304867-main_resume_v3.docx	30
24	bryan_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729748256728-bryan_resume.docx	33
25	bryan_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729748261665-bryan_resume.docx	34
26	bryan_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729748299760-bryan_resume.docx	35
27	bryan_resume.docx	\N	https://blobstorageta.blob.core.windows.net/tasks-files/1729748311764-bryan_resume.docx	36
28	main_resume.pdf	51	https://blobstorageta.blob.core.windows.net/blobstorageta/aa56537b-0659-4444-ad6f-775d7beb0e5f-main_resume.pdf?sv=2024-11-04&st=2024-11-13T06%3A41%3A10Z&se=2024-11-13T07%3A41%3A10Z&sr=b&sp=r&sig=dzgZUJv76LKLTsxCgudMAQgWmIDmsVAnwe8x3%2Bfphh4%3D	\N
\.


--
-- Data for Name: Student; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Student" (id, name, "createdAt", year, "studentCode") FROM stdin;
21	John Doe	2024-11-22 08:08:22.724	1	S12345
22	Jane Smith	2024-11-22 08:08:22.727	2	S54321
23	Alice Johnson	2024-11-22 08:08:22.729	3	S67890
24	Bob Lee	2024-11-22 08:08:22.73	1	S98765
25	Charlie Kim	2024-11-22 08:08:22.731	4	S11223
27	Bryan Tay	2024-11-22 08:24:17.901	1	BTAY013
\.


--
-- Data for Name: Task; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Task" (id, "createdAt", "professorId", "taId", "dueDate", details, status, name, "classId") FROM stdin;
5	2024-11-22 06:54:07.303	1	2	2024-10-01 00:00:00	tetet	completed	Untitled Task	1
2	2024-10-24 03:29:47.721	1	8	2024-10-04 00:00:00	tetetete	open	Untitled Task	1
3	2024-10-24 03:38:00.952	1	3	2024-10-17 00:00:00	hery	open	Untitled Task	1
1	2024-10-24 03:43:44.741	1	8	1970-01-01 00:00:00	update class	completed	Untitled Task	1
4	2024-10-24 03:47:29.354	1	8	2024-10-02 00:00:00	tetete	completed	Untitled Task	1
8	2024-10-24 04:07:58.7	1	8	2024-10-31 00:00:00	666666666	completed	666666666	1
7	2024-10-24 04:08:05.03	1	8	2024-10-01 00:00:00	123455	completed	12345	1
6	2024-10-24 04:08:10.1	1	8	2024-10-16 00:00:00	1232132131	completed	1231232131	1
9	2024-10-24 04:11:05.586	1	8	2024-10-18 00:00:00	abc	completed	abc	1
10	2024-10-24 04:22:40.81	1	8	2024-10-31 00:00:00	31231231	completed	12312321	1
11	2024-10-24 04:23:02.833	1	8	2026-10-09 00:00:00	completetest	completed	completetest	1
24	2024-10-24 05:10:57.773	1	8	2024-10-31 00:00:00	12312321321	completed	123213124242	1
23	2024-10-24 05:11:00.349	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
21	2024-10-24 05:11:02.871	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
22	2024-10-24 05:11:04.898	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
20	2024-10-24 05:11:06.897	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
19	2024-10-24 05:11:08.894	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
18	2024-10-24 05:11:11.747	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
17	2024-10-24 05:11:14.271	1	8	2024-10-31 00:00:00	12312321321	completed	12321312	1
25	2024-10-24 05:12:52.676	1	8	2024-10-31 00:00:00	abcaca	completed	abc	1
33	2024-10-24 05:38:37.3	1	8	2024-10-31 00:00:00	ababab	completed	abc	1
36	2024-10-24 05:38:40.639	1	8	2024-10-31 00:00:00	ababab	completed	abc	1
35	2024-10-24 05:38:43.198	1	8	2024-10-31 00:00:00	ababab	completed	abc	1
34	2024-10-24 05:38:46.142	1	8	2024-10-31 00:00:00	ababab	completed	abc	1
32	2024-10-24 05:38:49.248	1	8	2024-10-31 00:00:00	abbab	completed	abcv	1
31	2024-10-24 05:38:51.769	1	8	2024-10-31 00:00:00	abbab	completed	abcv	1
30	2024-10-24 05:38:54.629	1	8	2024-10-31 00:00:00	abc	completed	abc	1
29	2024-10-24 05:38:57.017	1	8	2024-10-31 00:00:00	abc	completed	abc	1
27	2024-10-24 05:38:59.09	1	8	2024-10-31 00:00:00	abc	completed	abc	1
28	2024-10-24 05:39:01.025	1	8	2024-10-31 00:00:00	abc	completed	abc	1
26	2024-10-24 05:39:06.619	1	8	2024-10-31 00:00:00	312321312	completed	1232131	1
16	2024-10-24 05:39:09.067	1	8	2024-10-31 00:00:00	testing	completed	testing	1
15	2024-10-24 05:39:14.047	1	8	2024-10-31 00:00:00	testing	completed	testing	1
14	2024-10-24 05:40:02.808	1	8	2024-10-31 00:00:00	rerere	completed	red	1
13	2024-10-24 05:40:05.197	1	8	2024-10-31 00:00:00	red	completed	red	1
12	2024-10-24 05:40:19.65	1	8	2024-10-31 00:00:00	red	completed	red	1
37	2024-11-22 06:56:05.796	1	2	2024-10-30 00:00:00	red	open	red	\N
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Ticket" (id, "ticketDescription", category, priority, "createdAt", "updatedAt", "taId", "professorId", status, "classId", "studentId") FROM stdin;
2	Lab access issue	Lab	medium	2024-10-23 13:50:00.29	2024-10-23 13:50:00.29	2	5	open	2	\N
3	Problem with quiz system	Quiz	low	2024-10-23 13:50:00.385	2024-10-23 13:50:00.385	3	6	open	2	\N
5	Issue with lab report submission	Lab	high	2024-10-23 13:50:02.533	2024-10-23 13:50:02.533	2	6	open	2	\N
7	Question on project submission	Project	medium	2024-10-23 14:06:57.81	2024-10-23 14:06:57.81	3	4	open	2	\N
8	Issue with final exam material	Exam	high	2024-10-23 14:06:57.903	2024-10-23 14:06:57.903	3	5	open	2	\N
9	Clarification on quiz grading	Quiz	low	2024-10-23 14:06:58.014	2024-10-23 14:06:58.014	3	6	open	2	\N
10	Issue with project submission	Project	medium	2024-10-23 14:18:04.998	2024-10-23 14:18:04.998	8	6	open	2	\N
11	Question about final exam format	Exam	high	2024-10-23 14:18:05.107	2024-10-23 14:18:05.107	8	7	open	2	\N
12	Problem with quiz grading	Quiz	low	2024-10-23 14:18:05.215	2024-10-23 14:18:05.215	8	6	open	2	\N
13	Help needed with lab access	Lab	medium	2024-10-23 14:18:05.308	2024-10-23 14:18:05.308	8	7	open	2	\N
57	test	Lab	high	2024-11-22 08:37:19.423	2024-11-22 08:37:29.241	8	1	completed	2	27
58	123213131	Lab	high	2024-11-22 08:46:11.435	2024-11-22 08:46:11.435	8	1	open	15	27
26	testing	Assignment	low	2024-10-23 08:47:02.086	2024-10-23 08:47:02.086	8	6	open	2	\N
30	fsafsafas	Assignment	high	2024-10-23 10:24:53.758	2024-10-23 10:24:53.758	8	5	open	2	\N
32	fasfasfasf	Exam	high	2024-10-23 10:26:47.793	2024-10-23 10:26:47.793	8	7	open	2	\N
34	hello	Assignment	high	2024-10-23 11:37:42.898	2024-10-23 11:38:08.651	8	1	completed	2	\N
35	asfsafsa	Assignment	high	2024-10-23 11:42:29.718	2024-10-23 11:42:44.775	8	1	completed	2	\N
37	abc	Lab	high	2024-10-23 11:44:00.861	2024-10-23 11:44:17	8	1	completed	2	\N
38	312321	Assignment	high	2024-10-23 11:46:12.666	2024-10-23 11:46:32.094	8	1	completed	2	\N
39	fsafsafa	Assignment	low	2024-10-23 11:49:09.692	2024-10-23 11:49:24.451	8	1	completed	2	\N
40	czxcxzcxz	Lab	high	2024-10-23 12:08:01.234	2024-10-23 12:08:19.128	8	1	completed	2	\N
41	test	Assignment	high	2024-10-24 03:19:16.782	2024-10-24 03:20:18.251	8	1	completed	2	\N
43	asfsafsa	Assignment	low	2024-11-13 05:47:06.745	2024-11-13 05:47:06.745	8	7	open	\N	\N
44	321321321	Assignment	high	2024-11-13 05:48:05.575	2024-11-13 05:48:05.575	8	5	open	\N	\N
45	abc	Assignment	low	2024-11-13 05:52:10.785	2024-11-13 05:52:10.785	8	5	open	\N	\N
47	abcde	Assignment	low	2024-11-13 05:54:55.137	2024-11-13 05:54:55.137	8	5	open	1	\N
48	final	Assignment	low	2024-11-13 05:55:32.084	2024-11-13 05:55:32.084	8	5	open	1	\N
50	testing1313	Assignment	low	2024-11-13 06:24:36.787	2024-11-13 06:24:36.787	8	5	open	1	\N
51	asfsafsa	Assignment	medium	2024-11-13 06:41:10.161	2024-11-13 06:41:10.161	8	5	open	3	\N
52	abc	Assignment	medium	2024-11-13 06:49:56.204	2024-11-13 06:49:56.204	8	6	open	2	\N
53	red	Exam	medium	2024-11-13 07:07:16.408	2024-11-13 07:08:59.416	8	1	completed	1	\N
28	testing	Assignment	medium	2024-10-23 08:47:28.822	2024-11-22 06:56:35.384	8	1	completed	2	\N
42	123	Assignment	low	2024-11-13 05:46:43.531	2024-11-13 05:46:43.531	8	7	open	\N	\N
46	safsafas	Lab	low	2024-11-13 05:52:37.972	2024-11-13 05:52:37.972	8	7	open	\N	\N
49	testt2132131	Assignment	medium	2024-11-13 06:01:02.416	2024-11-13 06:01:02.416	8	5	open	4	\N
54	red	Exam	medium	2024-11-22 06:51:58.298	2024-11-22 06:51:58.298	8	5	open	2	\N
55	Redasdsa	Assignment	high	2024-11-22 08:29:36.87	2024-11-22 08:29:36.87	8	5	open	1	21
56	teststs	Project	medium	2024-11-22 08:36:48.116	2024-11-22 08:36:48.116	8	1	open	2	22
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."User" (id, name, email, "createdAt", role) FROM stdin;
2	John Doe	ta1@example.com	2024-10-23 13:47:30.144	TA
3	Jane Smith	ta2@example.com	2024-10-23 13:47:30.144	TA
4	Sam Wilson	ta3@example.com	2024-10-23 13:47:30.144	TA
5	Dr. Robert	prof1@example.com	2024-10-23 13:47:35.019	PROFESSOR
6	Dr. Emily	prof2@example.com	2024-10-23 13:47:35.019	PROFESSOR
7	Dr. Clark	prof3@example.com	2024-10-23 13:47:35.019	PROFESSOR
9	Raymond Tay	poppybryantay@gmail.com	2024-10-24 05:34:38.87	USER
8	BTAY013	btay013@e.ntu.edu.sg	2024-10-23 06:04:40.885	TA
1	Professor Victor	rivenbryan@gmail.com	2024-10-22 03:03:25.942	PROFESSOR
\.


--
-- Data for Name: _ClassStudents; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."_ClassStudents" ("A", "B") FROM stdin;
1	21
1	22
1	23
1	24
1	25
2	21
2	22
2	23
2	24
2	25
1	27
15	21
15	22
15	23
15	24
15	25
15	27
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1112cf06-ab0f-41cf-afc0-df16faf9a657	0c9ad546f7977f001a9e9b48c3bfbc6100d831db6916e5e655efe98b33de4fca	2024-10-22 10:45:20.906007+08	20241022024520_init	\N	\N	2024-10-22 10:45:20.89102+08	1
853ecedb-c431-49cc-b989-102dce49a018	9c24bbd23c307a6844721743de00f80ed6038a65bfda8c28208d1c6fb61c3bff	2024-11-13 14:00:16.895289+08	20241113060016_remove_ticket_number	\N	\N	2024-11-13 14:00:16.89324+08	1
0e79a7de-2b50-4a1c-ac13-23a595286d9a	802f29aaa4a40f58f02b8d7e7ff51f0d3d200901059efe04cd425787d26c0598	2024-10-23 13:40:19.704126+08	20241023032528_add_role_to_user	\N	\N	2024-10-23 13:40:19.696964+08	1
aefa20b1-cef0-4ceb-af72-44aecb8a2b1d	440f7c4858200c66b4d31baa572b46400039ba10275b4af7bb77020972780692	2024-10-23 13:40:19.706019+08	20241023033529_add_ta_prof	\N	\N	2024-10-23 13:40:19.704584+08	1
3ed84851-946e-49f7-9c7b-7e020a5e9b1b	03c256c3f54ccd49590ee9bc4c0a522313646133d5da56a6a6841e72cc87bcb5	2024-10-23 13:40:19.738037+08	20241023034630_add_ticket_user_relation	\N	\N	2024-10-23 13:40:19.706534+08	1
676115cf-4357-4ddf-b8a3-7329500ab99b	71efe74f2fe3ff893fa08fd98a8fa28d68f42fc7c7bec49d36f3cfe5cf5b2a14	2024-11-13 14:10:16.404324+08	20241113061016_remove_ticket_number	\N	\N	2024-11-13 14:10:16.397415+08	1
a38130a2-6441-4494-b0ca-06acc0bf1be8	d6efc5213794b01d5ededed97ba7fe16fb61452336c1d68a0e1599242d99824b	2024-10-23 17:52:08.541668+08	20241023095208_add_ticket_files	\N	\N	2024-10-23 17:52:08.524273+08	1
3fd234f3-a19f-436f-8b0f-ce15cef2283e	088689fcc94ca8cde4483c4e2299c8ab0924127b7edc7576ffa95584700ca559	2024-10-23 18:16:53.485417+08	20241023101653_add	\N	\N	2024-10-23 18:16:53.460496+08	1
4896c800-c59b-4a1c-a7ba-4fa732aff889	ff1a272273547efd520b5c966b1953f229d43d6cd2dd3e733d3cafe959bdef78	2024-10-23 19:34:59.696767+08	20241023113459_add_ticket_status	\N	\N	2024-10-23 19:34:59.688948+08	1
1863bd96-05fc-443e-bbd0-ef489897f3f6	0b9952403cdb8ed1530d1f703b1bf16a7a0de681a238c69e26924922391bdcbc	2024-11-13 14:10:47.489718+08	20241113061047_remove_ticket_number	\N	\N	2024-11-13 14:10:47.48634+08	1
1b9b3568-05b7-422b-af5a-10e92238e7ab	0ae3182490f64ad09b65e167115dad2224a61699b71878e3c6a8f3f38556f40a	2024-10-23 20:28:30.347587+08	20241023122830_tasks	\N	\N	2024-10-23 20:28:30.326854+08	1
e9584597-9a6a-4f7a-b6ba-ab889a3abc1a	f18ee182868a08b9288a0594527a2e4a7f21aebd0fbe47fbb4f16c94cfd28ec6	2024-10-24 11:56:18.883899+08	20241024035618_add_task_name_field	\N	\N	2024-10-24 11:56:18.875774+08	1
6338fbb8-afbc-48c7-a189-46b54c8ae036	6217864b935637f9c310acd7d9f169f8e64bc05b86c155ac7d4719fa3c4cabe6	2024-11-13 13:05:08.002293+08	20241113050507_make_class_id_optional	\N	\N	2024-11-13 13:05:07.970268+08	1
98c6128b-5cbd-4e7f-88aa-b04d03948959	39687cb2262ae337bee0b3b815ddcd34d483d0267d017e661c067e4d386bebcf	2024-11-22 15:26:22.635163+08	20241122072622_add_course_name_to_class	\N	\N	2024-11-22 15:26:22.627128+08	1
f8c38f59-d8f4-47c5-b46d-f1bb056358a3	5a76b2c9bbaaa2d5ec153f1a09a99cc331cec15a49b67cf9d5332a0dc119fbb6	2024-11-13 13:14:33.797359+08	20241113051433_update_student_schema	\N	\N	2024-11-13 13:14:33.790865+08	1
76c6fcca-ede2-4f41-8b8f-0d53c5aa8fea	6da6aee250847efeda274d1110045cf6e7d04a9556f7639a6bdb6bba5dc657fd	2024-11-13 13:21:40.321448+08	20241113052140_link_ticket_to_student	\N	\N	2024-11-13 13:21:40.315315+08	1
7cca641f-0fcd-41ac-8fa9-f7f00fe4a9ec	0b9952403cdb8ed1530d1f703b1bf16a7a0de681a238c69e26924922391bdcbc	2024-11-13 13:57:35.960055+08	20241113055735_remove_ticket_number	\N	\N	2024-11-13 13:57:35.956122+08	1
7a19f6e8-2c62-43d6-8adc-c1ec298e7086	f341a3c0ae39d68649d316970e27ee1eac8d0f4f98ce1d303ff0bb2b09d30805	2024-11-22 16:04:30.312926+08	20241122080430_add_student_code	\N	\N	2024-11-22 16:04:30.307174+08	1
8b3d79a5-93c9-46fb-9e59-2e8d2d05685a	2d251c9fa1cf338491bc624c27e82f23258057be81823443133325d467819cb2	2024-11-22 16:22:33.059406+08	20241122082233_rename	\N	\N	2024-11-22 16:22:33.038081+08	1
\.


--
-- Name: Class_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Class_id_seq"', 21, true);


--
-- Name: Comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Comment_id_seq"', 23, true);


--
-- Name: File_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."File_id_seq"', 28, true);


--
-- Name: Student_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Student_id_seq"', 27, true);


--
-- Name: Task_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Task_id_seq"', 37, true);


--
-- Name: Ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Ticket_id_seq"', 58, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."User_id_seq"', 9, true);


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
-- Name: Class_courseCode_groupCode_key; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "Class_courseCode_groupCode_key" ON public."Class" USING btree ("courseCode", "groupCode");


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
-- Name: Task Task_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Task Task_professorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Task Task_taId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Task"
    ADD CONSTRAINT "Task_taId_fkey" FOREIGN KEY ("taId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_classId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_classId_fkey" FOREIGN KEY ("classId") REFERENCES public."Class"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_professorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_studentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES public."Student"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Ticket Ticket_taId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_taId_fkey" FOREIGN KEY ("taId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO riven;


--
-- PostgreSQL database dump complete
--

