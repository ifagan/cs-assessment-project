# **CommunityShare assessment project**

This codebase is for CommunityShare’s assessment project. I was asked to build a simplified task management application that demonstrates full stack capabilities and product thinking.

## **Overview and technology choices**

The front end is built in React and TypeScript, styled with the Tailwind CSS framework, and is hosted by Vercel. The back end is PostgreSQL provided by Supabase.

I originally intended to use Node.js for the back end, but in the planning stages I realized I wouldn’t actually need it. Supabase handles user authentication, and row-level security in Postgres prevents unauthorized tampering with the data. I can envision scenarios that would require more back-end logic than Postgres policies can handle, but none of them seemed likely to come up in the process of building a simple task management app. 

## **Setup and installation instructions**

* All the code is available through the GitHub repository at [https://github.com/ifagan/cs-assessment-project](https://github.com/ifagan/cs-assessment-project).  
* To deploy the client, clone the repository, install dependencies with npm install, then build and run the client with **npm run dev**.  
* To connect to the existing Postgres back end at Supabase, you also need to set two environment variables, VITE\_SUPABASE\_URL and VITE\_SUPABASE\_ANON\_KEY, the values of which I can provide, but they are not included in this README or in the GitHub repository. (VITE\_SUPABASE\_ANON\_KEY is a public key that allows the client to create an encrypted connection to the Postgres database.)  
* If deploying elsewhere, you would need to create a Postgres database and set up the tables (see /Database\_schema.sql), enable user authentication (trivial through Supabase’s admin panel; might be more arduous through a different provider), create the row-level security policies (see /Database row-level policies.json), and set the environment variables mentioned above (if using Supabase; the process would probably be slightly different with another Postgres provider.) The tables don’t need any data; for demonstration purposes, I have left it so that you can create your own login without any kind of administrative approval, so you can simply create your own account as the first record in the “profiles” table and then start adding projects and tasks.  
* As a side note, I already have Vercel set up to auto-deploy whenever the main branch is updated in the GitHub repository.

## **Architecture decisions**

PostgreSQL was an easy choice for the back end, both because it’s already part of CommunityShare’s stack and because I have a strong SQL background. You can view a visual representation of the database schema in the GitHub repository at /Database schema diagram.png. There are only four database tables:

* **profiles** (user records, including username and role; Supabase keeps email addresses separate via its own authentication process, but allows for registration/login via magic link)  
* **projects** (with fields for title and description)  
* **tasks** (title, description, due date, status, priority, and a “created\_by” field indicating the user that created it)  
* **tasks\_assigned\_users** (linking tasks to the users they are assigned to; the relevant fields are just task\_id and user\_id)

Putting the back end into Postgres comes with built-in security; not just encrypted connections and the built-in user authentication, but the row-level security policies that are mentioned above that block certain unwanted activities at the database level. Here are a few examples of those row-level security policies:

* You must be logged in to read data from any table. (As mentioned earlier, at present anyone can create an account without administrative approval, so this isn’t much of a block \- but if I were to put this into production we would change that and no one without an approved account would be able to view any data.)  
* User profiles cannot be deleted. With more time, I would have added a way to disable a user profile, but this policy ensures that should an intruder gain access to the system by creating an unauthorized account, there would be no way to hide their tracks by removing it.  
* Tasks can only be updated or deleted by the users that created them *or* by users with “project manager” or “administrator” privileges. On the user side, task edit/delete buttons are only shown to users with these privileges. However, since we can’t rely on the client to enforce security, the database’s row-level policies ensure that regular users cannot alter or delete other users’ tasks.

On the client side, React and Tailwind were easy choices, and TypeScript helps enforce strong typing, improving readability and maintainability. I also decided to make a point of working with the stack that (as I understand it) CommunityShare already relies upon \- thus React, TypeScript, Tailwind, and Postgres. I would have used Node and Express for the same reasons, but as noted above they would have been redundant for this particular project.

## **Assumptions made**

* I assumed that we would only want to have a task assigned to a single user at a time, so right now that’s limited through the client interface \- but breaking **tasks\_assigned\_users** into its own table (rather than simply setting **user\_id** as a field in **tasks**) puts us in position to change that easily if we decide that we want to be able to assign multiple users to a single task.  
* I assumed users should always be able to delete the tasks and projects that they created. That may not be a good assumption. Also, at present that’s a true deletion from the database; with more time, I would implement soft deletes (disabling records rather than removing them entirely).  
* As noted earlier, I decided to connect directly to Postgres rather than put Node between the client and the database. That’s perfectly fine for all the functionality required by this demonstration project, but there are probably some features one could come up with that would require back end code to mediate that Postgres tables, hooks, and policies alone can’t handle.  
* I assumed Supabase was fine as a database provider. That’s probably okay (their free tier works fine for this demonstration, their Pro tier costs $25/month and would handle any expansion of this app I can easily conceive of, their reputation is good, everything is open source so we could take the back end and self-host elsewhere, or we could also easily move the back end to some other PostgreSQL hosting service). But as someone who once recommended AWS to a client who (it turned out) was actively suing Amazon, I would (under normal circumstances) always discuss with the client *before* choosing a host.

## **Tradeoffs considered**

As noted above, a stack without Node (...or similar backend server code) does limit the logic that can be implemented on the back end. However, if we found a need for it, it would be relatively simple to spin up Node at Heroku (or the like) and add that functionality.

## **Future improvements**

Where to begin? There are a hundred things I would do with more time.

First on the list would be adding a way to add notes to projects and tasks. At present, the only way to do that is to update the project or task description. This is a no-brainer and I simply ran out of time, but it’s the \#1 thing I would do if I were to continue work on this.

Second would be a closely related task: allowing the upload of files to associate with projects and tasks. Supabase offers a Storage API that links the database with arbitrary file storage and backs it with a CDN, so we’d be well-positioned to implement that, but again, I didn’t have time for it.

Real-time updates would be third on my list; fortunately, Supabase offers a “broadcast” library that leverages the existing user authentication and encryption to notify users of changes to designated tables. I’d start with simple notifications like “\[username\] updated \[task\]” if you’re logged in and \[task\] is assigned to you, and then ideally implement a fully collaborative interface so you can see changes other people are making to projects and tasks in real-time if you have those views open.

After that, in no particular order:

* A review of row-level Postgres security policies (The tools are robust, but I’m not 100% certain I have this locked down as securely as it could be. In particular, they need to be tightened up with respect to the capabilities related to elevated user privileges.)  
* Sign-in \- right now, this is via magic link, but I’d probably move it to OAuth if I had a little more time (Supabase supports this as well as a variety of other social auth providers.)  
* Admins should be able to create/edit/delete user profiles, including changing their privileges (I’d also remove the capability to elevate your own privileges, but for demonstration purposes it makes sense to leave that in)  
* Right now you can’t delete a project if it has tasks assigned, which makes sense, but it doesn’t generate a useful error message.  
* On that note, as I mentioned above, I would change any “delete” functionality to simply mark records in the database as disabled \- ensuring they don’t show up in queries, but leaving them in the system in case we need to resurrect or review them.  
* This demonstration app is never going to have that many records, but if we were going to production I would want to add some more indices to the Postgres tables for performance optimization.  
* When you log in you get taken to the Tasks view, which should default to filtering for tasks assigned to you.  
* More informative comments in the code  
* General refactoring of the code (there’s some repetition \- the inline CSS could particularly use some consolidation)  
* Certain sets of information (like the priority (low, medium, and high) and status (to do, in progress, complete)) are repeated in the code, and should really be established in the database in locked-down tables so that we can easily change or add to those options without altering the code.
