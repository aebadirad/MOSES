MOSES (Marklogic Originating Spatial Evaluation Service)

Data is derived from www.geonames.org, modified to fit a NoSQL document format, all else is original work.


====
REQUIRED HARDWARE

A production version of this will not be insignificant in terms of hardware.

The design is heavily weighted to use disk space to optimize on ram and cpu, so use SDDs if possible.

For development you'll want around 2 cpus and 8 gigs of ram. You can get away with less, but initial 
ingestion of the data will be pretty miserable if you do. Operationally, you could squeak by with 
1 cpu and 2gb if you absolutely had to and wanted to do ingestion in batches or only use a few countries
 worth of data.

For light production you'll want at least 4 cores, 8 gigs of ram.

For anything that gets over a few thousand hits an hour, you'll need at least a 4-6 core with 16 gigs of ram.

For public services, you'll want a 12+ core, 32 gig ram setup. You'll be able to serve millions an hour.

====

1. Clone the repo
2. Install node v0.10.* or later
3. From the base directory, run npm install
4. Unzip resources.zip into folder /resources
5. From node, run convertData.js to generate your data. NOTE: this will take a while
6. Modify xxx to match your MarkLogic server IP, port, and admin username/password
7. Run xxx bootstrap
8. Run xxx to deploy modules
9. Run through 'deploying the geospatial data' steps listed below
10. MOSES should now be installed!

====
Deploying Geospatial Data

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/country-info -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections country

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/feature-codes -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections feature-code

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/admin-codes -output_uri_replace "path/to/moses/data/,''" -batch_size=100 -thread_count 2 -output_collections admin-code

mlcp import -host <ip> -port 8042 -username admin -password password -input_file_path path/to/moses/data/locations -output_uri_replace "path/to/moses/data/,''" -batch_size=150 -thread_count 12 -output_collections location