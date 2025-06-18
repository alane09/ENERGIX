# COFICAB ENERGIX Dashboard API Documentation

This document provides comprehensive documentation for the COFICAB ENERGIX Dashboard API, detailing all available endpoints, their functionality, request parameters, and response formats.

## Base URL

The API base URL is: `http://localhost:8080/api`

All endpoints are prefixed with this base URL. The context path `/api` is configured in `application.properties` with the property `server.servlet.context-path=/api`.

## Authentication

Currently, the API uses CORS with origins restricted to localhost development environments (`@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:3001"}, allowCredentials = "true")`).

## Controllers Overview

The API is organized into five main controllers:

1. **VehicleController** - Handles vehicle records and statistics
   - Base path: `/records`
   - Note: With context path `/api`, the full path becomes `/api/records`

2. **RegressionController** - Handles regression analysis and SER calculations
   - Base path: `/regression`
   - Note: This controller does NOT include `/api` in its request mapping, so the full path becomes `/api/regression`

3. **UploadController** - Handles file uploads and data extraction
   - Base path: `/`
   - Note: This controller does NOT include `/api` in its request mapping, so the full path becomes `/api/`

4. **ReportsController** - Handles report generation and management
   - Base path: `/reports`
   - Note: This controller does NOT include `/api` in its request mapping, so the full path becomes `/api/reports`

5. **FileController** - Handles file operations for MongoDB GridFS storage
   - Base path: `/files`
   - Note: This controller does NOT include `/api` in its request mapping, so the full path becomes `/api/files`

## Detailed Endpoints

### Vehicle Controller (`/api/records`)

#### Get All Records
- **Endpoint**: `GET /api/records`
- **Description**: Get all vehicle records with optional filtering
- **Query Parameters**:
  - `type` (optional): Filter by vehicle type
  - `mois` (optional): Filter by month
  - `matricule` (optional): Filter by vehicle ID
- **Response**: List of vehicle records

#### Get Monthly Aggregation
- **Endpoint**: `GET /api/records/monthly-aggregation`
- **Description**: Get monthly aggregated data for dashboard statistics
- **Query Parameters**:
  - `type`: Vehicle type to get aggregation for
- **Response**: Map of months to aggregated metrics

#### Get Performance Data
- **Endpoint**: `GET /api/records/performance`
- **Description**: Get vehicle performance data for comparison
- **Query Parameters**:
  - `type`: Vehicle type to get performance data for
- **Response**: List of vehicles with performance metrics

#### Get Record by ID
- **Endpoint**: `GET /api/records/{id}`
- **Description**: Get a specific vehicle record by ID
- **Path Parameters**:
  - `id`: Record ID
- **Response**: Single vehicle record

#### Create Record
- **Endpoint**: `POST /api/records`
- **Description**: Create a new vehicle record
- **Request Body**: Vehicle record data
- **Response**: Created vehicle record

#### Update Record
- **Endpoint**: `PUT /api/records/{id}`
- **Description**: Update all fields of a vehicle record
- **Path Parameters**:
  - `id`: Record ID
- **Request Body**: Updated vehicle record data
- **Response**: Updated vehicle record

#### Partially Update Record
- **Endpoint**: `PATCH /api/records/{id}`
- **Description**: Partially update a vehicle record
- **Path Parameters**:
  - `id`: Record ID
- **Request Body**: Partial vehicle record data
- **Response**: Updated vehicle record

#### Delete Record
- **Endpoint**: `DELETE /api/records/{id}`
- **Description**: Delete a vehicle record
- **Path Parameters**:
  - `id`: Record ID
- **Response**: 204 No Content

### Regression Controller (`/api/regression`)

#### Perform Regression
- **Endpoint**: `POST /api/regression/upload`
- **Description**: Perform regression analysis on data of a specific vehicle type
- **Query Parameters**:
  - `type`: Vehicle type (sheet name)
- **Response**: Regression result with equation and metrics

#### Save Manual Regression Result
- **Endpoint**: `POST /api/regression`
- **Description**: Save a manually created regression result
- **Request Body**: Regression result data
- **Response**: The saved regression result

#### Get All Regression Results
- **Endpoint**: `GET /api/regression`
- **Description**: Get all regression results
- **Response**: List of all regression results

#### Get Regression Result by Type
- **Endpoint**: `GET /api/regression/type/{type}`
- **Description**: Get regression result by vehicle type
- **Path Parameters**:
  - `type`: Vehicle type (sheet name)
- **Response**: Regression result

#### Get Regression Result by ID
- **Endpoint**: `GET /api/regression/{id}`
- **Description**: Get regression result by ID
- **Path Parameters**:
  - `id`: Regression result ID
- **Response**: Regression result

#### Delete Regression Result
- **Endpoint**: `DELETE /api/regression/{id}`
- **Description**: Delete a regression result
- **Path Parameters**:
  - `id`: Regression result ID
- **Response**: 204 No Content

#### Get Monthly Totals for Regression
- **Endpoint**: `GET /api/regression/monthly-totals/{type}`
- **Description**: Get monthly totals for regression analysis by vehicle type
- **Path Parameters**:
  - `type`: Vehicle type (sheet name)
- **Response**: Map of monthly totals suitable for regression analysis

### Upload Controller (`/api/`)

#### Upload File
- **Endpoint**: `POST /api/upload`
- **Description**: Upload an Excel file and get available sheet names
- **Request**: Multipart form data with `file` parameter
- **Response**: List of sheet names in the Excel file

#### Extract Data
- **Endpoint**: `POST /api/extract`
- **Description**: Extract data from a specific sheet in the uploaded Excel file
- **Request Parameters**:
  - `file`: Excel file (multipart form data)
  - `sheetName`: Name of the sheet to extract data from
- **Response**: List of extracted vehicle records

#### Save Data
- **Endpoint**: `POST /api/save`
- **Description**: Save extracted data to the database
- **Request Parameters**:
  - `file`: Excel file (multipart form data)
  - `sheetName`: Name of the sheet to save data from
  - `vehicleType`: Type of vehicle to categorize the data
  - `year`: Year for the data
  - `month` (optional): Month for the data, defaults to "all"
  - `replaceExisting` (optional): Whether to replace existing records, defaults to false
  - `region`: Region for the data
- **Response**: Success status with record count

#### Get Vehicle Types
- **Endpoint**: `GET /api/vehicles`
- **Description**: Get available vehicle types
- **Response**: List of vehicle types

### Reports Controller (`/api/reports`)

#### Generate Report
- **Endpoint**: `POST /api/reports/generate`
- **Description**: Generate a report based on specified parameters
- **Request Body**:
  ```json
  {
    "type": "string",
    "startDate": "string",
    "endDate": "string",
    "format": "pdf|excel"
  }
  ```
- **Response**: Report ID as a string

#### Get All Reports
- **Endpoint**: `GET /api/reports`
- **Description**: Get all generated reports
- **Response**: List of report objects

#### Delete Report
- **Endpoint**: `DELETE /api/reports/{id}`
- **Description**: Delete a specific report
- **Path Parameters**:
  - `id`: Report ID
- **Response**: 204 No Content

#### Download Report
- **Endpoint**: `GET /api/reports/{id}/download`
- **Description**: Download a specific report
- **Path Parameters**:
  - `id`: Report ID
- **Response**: Report download URL or content

### File Controller (`/api/files`)

#### Upload File
- **Endpoint**: `POST /api/files/upload`
- **Description**: Upload a file to MongoDB storage
- **Request Parameters**:
  - `file`: File to upload (multipart form data)
  - `vehicleType`: Type of vehicle to associate with the file (required)
  - `year`: Year to associate with the file (required)
- **Response**: File metadata with ID and available sheets

#### Get File Upload History
- **Endpoint**: `GET /api/files/history`
- **Description**: Get file upload history
- **Response**: List of file metadata DTOs

#### Get File by ID
- **Endpoint**: `GET /api/files/{id}`
- **Description**: Get file metadata by ID
- **Path Parameters**:
  - `id`: File ID
- **Response**: File metadata DTO

#### Download File
- **Endpoint**: `GET /api/files/{id}/download`
- **Description**: Download a file by ID
- **Path Parameters**:
  - `id`: File ID
- **Response**: File content

#### Delete File
- **Endpoint**: `DELETE /api/files/{id}/delete`
- **Description**: Delete a file by ID
- **Path Parameters**:
  - `id`: File ID
- **Response**: Success status

#### Get Files by Vehicle Type
- **Endpoint**: `GET /api/files/by-vehicle/{vehicleType}`
- **Description**: Get files filtered by vehicle type
- **Path Parameters**:
  - `vehicleType`: Type of vehicle
- **Response**: List of file metadata DTOs

#### Get Files by Year
- **Endpoint**: `GET /api/files/by-year/{year}`
- **Description**: Get files filtered by year
- **Path Parameters**:
  - `year`: Year to filter by
- **Response**: List of file metadata DTOs

#### Get Files by Region
- **Endpoint**: `GET /api/files/by-region/{region}`
- **Description**: Get files filtered by region
- **Path Parameters**:
  - `region`: Region to filter by
- **Response**: List of file metadata DTOs

## Data Models

### VehicleRecord
```json
{
  "id": "string",
  "type": "string",
  "matricule": "string",
  "mois": "string",
  "year": "string",
  "consommationL": "number",
  "consommationTEP": "number",
  "coutDT": "number",
  "kilometrage": "number",
  "produitsTonnes": "number",
  "ipeL100km": "number",
  "ipeL100TonneKm": "number",
  "rawValues": "object"
}
```

### RegressionResult
```json
{
  "id": "string",
  "type": "string",
  "regressionEquation": "string",
  "coefficients": "object",
  "intercept": "number",
  "rSquared": "number",
  "adjustedRSquared": "number",
  "mse": "number",
  "monthlyData": "array"
}
```

### FileDocument
```json
{
  "id": "string",
  "name": "string",
  "filename": "string",
  "contentType": "string",
  "size": "number",
  "uploadDate": "date",
  "year": "number",
  "vehicleType": "string",
  "region": "string",
  "sheetName": "string",
  "processed": "boolean",
  "recordCount": "number",
  "availableSheets": "array",
  "active": "boolean"
}
```

### FileDTO
```json
{
  "id": "string",
  "name": "string",
  "contentType": "string",
  "size": "number",
  "uploadDate": "date",
  "year": "number",
  "vehicleType": "string",
  "region": "string",
  "sheetName": "string",
  "processed": "boolean",
  "recordCount": "number",
  "availableSheets": "array"
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- 200 OK: Successful operation
- 201 Created: Resource created successfully
- 204 No Content: Resource deleted successfully
- 400 Bad Request: Invalid request parameters
- 404 Not Found: Resource not found
- 500 Internal Server Error: Unexpected server error

Error responses include a JSON object with an error message:
```json
{
  "error": "Error message description"
}
```

## Frontend Integration

When integrating with the frontend, ensure that:

1. The base URL is correctly set to `http://localhost:8080`
2. The context path `/api` is properly handled in API requests
3. For controllers that already include `/api` in their path (VehicleController), avoid duplicating the `/api` prefix
4. For controllers that don't include `/api` in their path (RegressionController, UploadController, FileController), add the `/api` prefix
5. CORS is configured to allow requests from `http://localhost:3000` and `http://localhost:3001` with credentials

## Example API Calls

### Get Dashboard Statistics
```javascript
fetch('http://localhost:8080/api/records/monthly-aggregation?type=Camion')
  .then(response => response.json())
  .then(data => console.log(data));
```

### Perform Regression Analysis
```javascript
fetch('http://localhost:8080/api/regression/upload?type=Camion', {
  method: 'POST',
  credentials: 'include'
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### Upload Excel File for Data Extraction
```javascript
const formData = new FormData();
formData.append('file', fileObject);

fetch('http://localhost:8080/api/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### Upload File to MongoDB Storage
```javascript
const formData = new FormData();
formData.append('file', fileObject);
formData.append('vehicleType', 'Camion');
formData.append('year', '2025');

fetch('http://localhost:8080/api/files/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'
})
  .then(response => response.json())
  .then(data => console.log(data));
```

### Get File Upload History
```javascript
fetch('http://localhost:8080/api/files/history', {
  credentials: 'include'
})
  .then(response => response.json())
  .then(data => console.log(data));
```
