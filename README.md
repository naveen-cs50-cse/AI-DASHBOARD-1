# AI-DASHBOARD-1
An AI-powered dashboard that converts natural language queries into SQL, retrieves data, and automatically generates the most suitable charts for visualization.

AI-Powered Smart Data Visualization Dashboard

An intelligent business intelligence dashboard that converts natural language queries into SQL and automatically generates the most suitable data visualizations.

Instead of manually writing SQL queries or designing charts, users can simply type questions in plain English. The system generates the SQL query, retrieves the data, and dynamically visualizes the results.

Overview

This project combines AI-driven query generation with dynamic chart rendering to create an interactive data analytics experience.

Workflow:

User asks a question in natural language

AI converts the question into an optimized SQL query

The backend executes the query on the database

Data is returned in structured JSON format

The system analyzes the dataset and automatically selects the most suitable chart

The visualization is rendered dynamically on the dashboard

Unlike traditional dashboards with fixed queries and predefined charts, this system adapts dynamically to user intent and handles diverse datasets.

Key Features

Natural Language → SQL query generation

Automatic JSON data processing

Smart chart selection based on dataset structure

Dynamic visualization using Chart.js

Handles complex and unpredictable datasets

User-friendly interface for non-technical users

Tech Stack

Frontend

HTML

CSS

JavaScript

Visualization

Chart.js

Backend

Node.js

Express.js

Database

SQLite / SQL

AI

LLM for Natural Language → SQL conversion

How It Works

User Query → AI Model → SQL Query → Database → JSON Data → Smart Chart Generator → Dashboard Visualization

Goal

The goal of this project is to make data analysis accessible to everyone, including users who have no knowledge of SQL or data visualization tools.

By combining AI with automated visualization logic, the system enables faster insights and intuitive data exploration.
