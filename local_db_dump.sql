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
-- Name: Comment; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Comment" (
    id integer NOT NULL,
    author text NOT NULL,
    content text NOT NULL,
    "ticketId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
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
-- Name: Ticket; Type: TABLE; Schema: public; Owner: riven
--

CREATE TABLE public."Ticket" (
    id integer NOT NULL,
    "ticketNumber" text NOT NULL,
    "ticketDescription" text NOT NULL,
    "courseGroupType" text NOT NULL,
    category text NOT NULL,
    student text NOT NULL,
    details text NOT NULL,
    priority text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "taId" integer NOT NULL,
    "professorId" integer NOT NULL
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
-- Name: Comment id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment" ALTER COLUMN id SET DEFAULT nextval('public."Comment_id_seq"'::regclass);


--
-- Name: Ticket id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket" ALTER COLUMN id SET DEFAULT nextval('public."Ticket_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: Comment; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Comment" (id, author, content, "ticketId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."Ticket" (id, "ticketNumber", "ticketDescription", "courseGroupType", category, student, details, priority, "createdAt", "updatedAt", "taId", "professorId") FROM stdin;
1	T-1001	Issue with assignment submission	Math 101	Assignment	Alice	Unable to submit assignment #3.	high	2024-10-23 13:49:51.576	2024-10-23 13:49:51.576	1	4
2	T-1002	Lab access issue	Physics 102	Lab	Bob	Unable to access lab materials.	medium	2024-10-23 13:50:00.29	2024-10-23 13:50:00.29	2	5
3	T-1003	Problem with quiz system	Chemistry 101	Quiz	Charlie	Unable to submit quiz answers.	low	2024-10-23 13:50:00.385	2024-10-23 13:50:00.385	3	6
4	T-1004	Exam preparation question	Math 101	Exam	David	Need clarification on exam topics.	medium	2024-10-23 13:50:00.479	2024-10-23 13:50:00.479	1	5
5	T-1005	Issue with lab report submission	Physics 102	Lab	Eve	Lab report submission system not working.	high	2024-10-23 13:50:02.533	2024-10-23 13:50:02.533	2	6
6	T-1006	Clarification needed for project guidelines	Computer Science 101	Project	Frank	Student needs clarification on the final project guidelines.	medium	2024-10-23 14:00:31.882	2024-10-23 14:00:31.882	1	4
7	T-2001	Question on project submission	Math 101	Project	Alice	Student needs clarification on the project submission process.	medium	2024-10-23 14:06:57.81	2024-10-23 14:06:57.81	3	4
8	T-2002	Issue with final exam material	Physics 201	Exam	Bob	Unable to find final exam materials on the portal.	high	2024-10-23 14:06:57.903	2024-10-23 14:06:57.903	3	5
9	T-2003	Clarification on quiz grading	Chemistry 102	Quiz	Charlie	Student is confused about the quiz grading system.	low	2024-10-23 14:06:58.014	2024-10-23 14:06:58.014	3	6
10	T-3001	Issue with project submission	Math 101	Project	Student A	Unable to submit project on the portal.	medium	2024-10-23 14:18:04.998	2024-10-23 14:18:04.998	8	6
11	T-3002	Question about final exam format	Physics 202	Exam	Student B	Clarification on the format of the final exam.	high	2024-10-23 14:18:05.107	2024-10-23 14:18:05.107	8	7
12	T-3003	Problem with quiz grading	Chemistry 101	Quiz	Student C	Received incorrect grade for the quiz.	low	2024-10-23 14:18:05.215	2024-10-23 14:18:05.215	8	6
13	T-3004	Help needed with lab access	Biology 103	Lab	Student D	Unable to access the lab resources.	medium	2024-10-23 14:18:05.308	2024-10-23 14:18:05.308	8	7
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public."User" (id, name, email, "createdAt", role) FROM stdin;
1	bryan	rivenbryan@gmail.com	2024-10-22 03:03:25.942	USER
2	John Doe	ta1@example.com	2024-10-23 13:47:30.144	TA
3	Jane Smith	ta2@example.com	2024-10-23 13:47:30.144	TA
4	Sam Wilson	ta3@example.com	2024-10-23 13:47:30.144	TA
5	Dr. Robert	prof1@example.com	2024-10-23 13:47:35.019	PROFESSOR
6	Dr. Emily	prof2@example.com	2024-10-23 13:47:35.019	PROFESSOR
7	Dr. Clark	prof3@example.com	2024-10-23 13:47:35.019	PROFESSOR
8	BTAY013	btay013@e.ntu.edu.sg	2024-10-23 06:04:40.885	TA
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: riven
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
1112cf06-ab0f-41cf-afc0-df16faf9a657	0c9ad546f7977f001a9e9b48c3bfbc6100d831db6916e5e655efe98b33de4fca	2024-10-22 10:45:20.906007+08	20241022024520_init	\N	\N	2024-10-22 10:45:20.89102+08	1
0e79a7de-2b50-4a1c-ac13-23a595286d9a	802f29aaa4a40f58f02b8d7e7ff51f0d3d200901059efe04cd425787d26c0598	2024-10-23 13:40:19.704126+08	20241023032528_add_role_to_user	\N	\N	2024-10-23 13:40:19.696964+08	1
aefa20b1-cef0-4ceb-af72-44aecb8a2b1d	440f7c4858200c66b4d31baa572b46400039ba10275b4af7bb77020972780692	2024-10-23 13:40:19.706019+08	20241023033529_add_ta_prof	\N	\N	2024-10-23 13:40:19.704584+08	1
3ed84851-946e-49f7-9c7b-7e020a5e9b1b	03c256c3f54ccd49590ee9bc4c0a522313646133d5da56a6a6841e72cc87bcb5	2024-10-23 13:40:19.738037+08	20241023034630_add_ticket_user_relation	\N	\N	2024-10-23 13:40:19.706534+08	1
\.


--
-- Name: Comment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Comment_id_seq"', 1, false);


--
-- Name: Ticket_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."Ticket_id_seq"', 23, true);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: riven
--

SELECT pg_catalog.setval('public."User_id_seq"', 8, true);


--
-- Name: Comment Comment_pkey; Type: CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_pkey" PRIMARY KEY (id);


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
-- Name: Ticket_ticketNumber_key; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "Ticket_ticketNumber_key" ON public."Ticket" USING btree ("ticketNumber");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: riven
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: Comment Comment_ticketId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Comment"
    ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES public."Ticket"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_professorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_professorId_fkey" FOREIGN KEY ("professorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Ticket Ticket_taId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: riven
--

ALTER TABLE ONLY public."Ticket"
    ADD CONSTRAINT "Ticket_taId_fkey" FOREIGN KEY ("taId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT ALL ON SCHEMA public TO riven;


--
-- PostgreSQL database dump complete
--

