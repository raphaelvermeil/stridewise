Motivation:
Concept: Whether the user is a beginner or an experienced runner, they will be able to gain an in depth analysis on their running form (e.g.: what is good, what needs to change, how to change, exercises, why for everything, etc.). By providing your personal goal, experience and running frequency (other metrics too), you will begin tracking your progress through scanning your form throughout your running journey. 
Demographic: People trying to improve their running form to avoid injury and increase performance.
Usage: Prescribed by health professionals & advertised on Strava
Problem: other apps use generalized prescriptions that don’t always match individual needs. This program will have adjustable parameters (strides/minute, knee height, etc.) that can be personalized to best suit individual biomechanical needs. We see in professional long distance running many different running forms and styles, all matched to specific needs, limitations, and abilities. This shows that there is no “one size fits all” for running technique. Instead, there are a few general metrics that, once individually set, can provide insights into what can be improved. This app would provide an easy and accessible way for recreational runners to gain access to this useful information.


User interface flow:
Sign Up / Log-In: Simple authentication service with user data stored securely
Personal Data: To gain better insight on the user and provide more accurate analyses, acquire the following data:
Gender
Weight
Height
Age
General fitness level
History of injuries
Idea: based on this info the app gives suggested goals for different metrics, but lets the user modify them based on their personal needs.
Set a Personal Running Goal/Plan: To personalize the user experience and gain a greater understanding of the user running history, ask the following questions:
How often do you run? How often would you like to run?
What type of running do you do? 
Have you run competitively or are planning to?
First Scan: The user will now be prompted to complete their first form scan where they will be walked through the process in a tutorial style.
The app accesses the webcam and tells them how to position the camera in front of the treadmill. 
Once the camera is set up, the user presses “record” which starts a 20 second timer to let them get on the treadmill.
If the camera was badly placed, it will inform the user that it wasn’t recorded properly and needs to be rerecorded following the instructions.
Once the user has recorded themselves running for a certain amount of time (30 seconds possibly) then the app goes into data processing with openCV, mediaPipe or equivalent technologies to map limbs and angles and data. 
This could possibly be done for multiple running angles (back, front maybe)
Results: Once the scan is complete, the results of the analysis will be displayed to the user. The results will touch upon the following:
Strides per minute
Max knee height
Strike position relative to center of mass
Torso angle relative to the horizontal
Head positioning
Elbow angle / arm movement
Recommended Plan: Based on your personal running goal, personal data, and first initial scan, the following is recommended:
Frequency of scans
What to look out for? What to fix?
Optimal running environments/conditions?

Feature list and screens:
Data that can be collected through treadmill video:
Strides per minute
Max knee height
Foot strike position relative to center of mass
Torso angle relative to horizontal 
Elbow angle/arm movement

Different “pages” that will be accessible to the user:
Start a new analysis session:
Brings user to a page that starts analysis using camera.
Walks them through camera positioning so that they are fully in view 
Once recording has started, gives them some time to get on the treadmill
Voice tells them to start treadmill at slow speed, tells them when to increase speed, tells them when to finish, automatically ends video once recording is complete
Upload: they can upload it as a session, where data will be stored and time stamped, and data from that session will be added to cumulative graphs, etc.

“My Data” page: where the user sees their metrics, progress, etc.
Let’s them select different sessions that they’ve had, and shows stats from those sessions
Shows different graphs, like the different parameters and how well they are aligned with the goals (like strides per minute, angles, etc.) over time (different sessions)

Parameter setting & adjustment: where they can pick what their goals are for different metrics (which will set the “goal” for good and bad on the graphs). These goals are adjustable, and when they are adjusted graphs will/can be updated for new goal/baseline.


Tech Stack:
Recommended stack
Pose estimation and all metric calculations run in the browser. There is no Python server or GPU host to deploy, the camera check can run live before recording, and the whole team works in TypeScript.
Frontend: Next.js (React) with TypeScript and Tailwind CSS, deployed on Vercel.
Pose estimation: MediaPipe Pose Landmarker (@mediapipe/tasks-vision) in VIDEO mode. The same code handles the live webcam and uploaded video files. Use the full model for live feedback and the heavy model when re-processing a recording.
Metrics engine: plain TypeScript functions that take landmark frames and return the metrics. Tested against landmark JSON saved from our recorded clips.
Video overlay: HTML canvas drawn over the video, showing the skeleton, joint angles and foot-strike markers.
Voice prompts: the browser's built-in Web Speech API (speechSynthesis), no extra library.
Auth and database: Supabase (Postgres + Auth). Store the landmarks and metrics for each session, not the raw video.
Charts: Recharts, with one line chart per metric across sessions and the user's goal shown as a band.
Recommendations: a rule table that maps each metric outside its goal to a cue and drills. Optional: an LLM (such as the Claude API) called from a Next.js API route to explain the results in plain language, using only the numbers the metrics engine computed.
Alternative if the team prefers Python: FastAPI with MediaPipe and OpenCV on a server. This allows heavier pose models, but videos must be uploaded, the live camera check is harder, and there is a server to deploy.
Phases
Phases 1 to 3 are the MVP and must work end to end before anyone starts phase 4. Hour ranges are targets out of the 45 hours.
Phase 1: Foundation (hours 0–8)
Record 3–4 side-view treadmill clips at a fixed speed, with different runners and both good and poor form. These are our test data and the demo backup, since there will be no treadmill at the venue.
Next.js app deployed on Vercel, and a Supabase project with auth and a sessions table.
MediaPipe running on an uploaded video, landmarks drawn on a canvas, and landmark JSON exported for each clip.
Agree on the two shared data formats: landmark frames (MediaPipe output plus timestamp) and the session record (metrics, treadmill speed, date).
Phase 2: Core metrics and results screen (hours 8–20)
Side view only. Use the leg nearest the camera and drop frames with low landmark visibility scores, since MediaPipe often swaps the left and right legs in a side view.
Cadence (steps per minute) from the repeating pattern of the ankle position.
Knee drive as the maximum thigh angle from vertical, not a height in pixels.
Overstriding as the horizontal distance from the foot to the hip at contact, divided by leg length.
Torso lean from vertical, elbow angle, and head position (ear relative to shoulder).
Report each metric as the median over all strides in the recording.
Results screen with annotated video playback and one card per metric.
Phase 3: Scan flow, history and goals (hours 20–32)
Live camera check before recording: key points visible, runner fills enough of the frame, camera side-on (both shoulders overlap).
Countdown, voice prompts and a 30-second recording at one fixed speed that the user enters. Cadence and stride change with speed, so sessions are only comparable at the same speed.
Sessions saved to Supabase with the date and treadmill speed.
“My Data” page with charts across sessions, and adjustable goals that redraw the goal bands.
Short onboarding: height (used to convert pixels to cm), experience, running frequency and injury history.
Rule-based recommendations on the results screen, with goals set relative to the user's first scan.
Seed 4–5 past sessions on the demo account so the charts have data.
MVP checkpoint at about hour 32: the full demo works from a pre-recorded clip. Stop adding features, fix bugs and rehearse the demo.
Phase 4: Extra side-view metrics (stretch)
Vertical oscillation (how much the runner bounces), in cm, scaled using the user's height.
Shin angle at foot contact, as a second overstriding measure.
Left and right leg comparison where both legs are clearly visible.
Plain-language explanations of each result from an LLM.
Phase 5: Rear view (stretch)
Second recording from behind the treadmill.
Pelvic drop, knees moving inward and feet crossing the midline. These are the main injury-related signs that a side view cannot show.
Phase 6: After the hackathon
Strava API to pre-fill running frequency and history.
Phone recording at 60 fps for better foot tracking.
Analysis of each treadmill speed separately within one session.
Shareable report for a physiotherapist or coach.
Splitting the work into 4 parts
Each part has one owner. The parts connect only through the two shared formats agreed in phase 1, so all four people can work in parallel from the start, using the recorded clips and fake session data until the real pieces are ready.
Part 1, pose pipeline and metrics: MediaPipe setup, frame filtering, every metric calculation, and tests against the recorded clips. Delivers one function that takes landmark frames and returns the session metrics. This part decides whether the demo works, so it goes to the strongest math and computer-vision person.
Part 2, scan flow: camera access, live camera check, countdown and voice prompts, recording, video file upload, skeleton overlay and annotated playback.
Part 3, results and dashboard: results screen, “My Data” page, charts and the goal adjustment screen. Built on fake session data until part 1's metrics are ready.
Part 4, backend, onboarding and recommendations: Supabase schema and auth, onboarding screens, saving and loading sessions, the recommendation rule table, seeded demo data and deployment. Also owns the pitch and demo script.
Integration points: parts 1 and 2 at about hour 12 (live video into the pipeline), parts 1 and 3 at about hour 20 (real metrics on the results screen), and everyone at the hour 32 checkpoint.


