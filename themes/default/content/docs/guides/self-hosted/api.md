---
title: Pulumi API
menu:
    userguides:
        parent: self_hosted
        identifier: self_hosted_api_service
        weight: 1
meta_desc: Pulumi API is one of the components required for self-hosting Pulumi. Self-hosting is available as part of the Enterprise Edition.
---

{{% notes type="info" %}}
Self-hosting is only available with **Pulumi Enterprise Edition**. [Contact us]({{< relref "/contact.md" >}}) if you would like to evaluate the Self-Hosted Enterprise Edition.

To manage your state with a self-managed backend, such as a cloud storage bucket, see [State and Backends]({{< relref "/docs/intro/concepts/state" >}}).
{{% /notes %}}

The Pulumi API is one of the components required for self-hosting Pulumi in your organization's environment. It provides the necessary APIs for both the CLI and the [Console]({{< relref "console" >}}).

## Prerequisites

* Provide a server or virtual machine to install and run the Pulumi components (see Minimum System Requirements below).
* Provide a persistent volume for the service to store checkpoint objects.
* Provider a persistent volume for the MySQL data (optional if you are providing your own DB.)
* If you are providing your own DB instance, ensure that it is accessible within the same Docker network that the service and the UI containers will be running in.
    * The default DB endpoint is `pulumi-db:3306`. If you wish to change this, set `PULUMI_LOCAL_DATABASE_NAME` and `PULUMI_LOCAL_DATABASE_PORT` accordingly (see Script Variables.)
    * If you do not create this network prior to running `run-ee.sh`, it will create only a bridged network on your local host. Ensure that the DB can be accessed by the API service container.
* Provide an external load balancer with TLS termination.

## Minimum System Requirements

| Type | Properties | Notes |
| ---- | ---------- | ----- |
| Compute | 2 CPU cores w/ 8 GB memory | |
| Storage | 20GB SSD |  For MySQL data.<br><br>**Note**: By default, the installation uses a single data path via `PULUMI_DATA_PATH` to map both the SQL data volume and the object storage path. Specify a volume for the `db` container as required. |
| Storage | 200GB SSD |  For Object Storage.<br><br>**Note**: By default, the installation uses a single data path via `PULUMI_DATA_PATH` to map both the SQL data volume and the object storage path. A dedicated path can be set via env var `PULUMI_LOCAL_OBJECTS` for the `api` container. |

> **Note**: The storage recommendations for the Object Storage can be lesser than 200GB depending on your organization size and the expected usage.

## What's In The Container?

{{% notes type="info" %}}
The container image repository is private. [Contact us]({{< relref "/contact.md" >}}) if you would like to evaluate the Self-Hosted Enterprise Edition.
{{% /notes %}}

The API service is a Go-based application. This is a single binary application that has all of the dependencies it needs in order to run.

### Server

This container runs an HTTP server which provides the APIs needed by the Console and the CLI. By default this container will serve using port `8080` over standard HTTP. If [TLS](#tls-environment-variables) is configured the server will instead serve over port `8443` using HTTPS.

## Primary Environment Variables

| Variable Name | Description |
| ------------- | ----------- |
| PULUMI_LICENSE_KEY | The license key value. A JWT string.<br><br>**Note**: Be sure to enclose the value in single-quotes. |
| PULUMI_DATABASE_ENDPOINT | The database server endpoint in the format `host:port`. This should be a MySQL 5.6 server. |
| PULUMI_DATABASE_NAME | The name of the database on the database server. |
| PULUMI_API_DOMAIN | The internet or network-local domain using which the API service can be reached, e.g. `api.pulumi.com`. Default is `localhost:8080`. |
| PULUMI_CONSOLE_DOMAIN | The internet or network-local domain using which the Console can be reached, e.g. `app.pulumi.com`. Default is `localhost:3000`. |
| PULUMI_LOCAL_OBJECTS | Folder path for persisting state for stacks. Ensure that this path is highly available, and backed-up regularly. |

### Other Environment Variables

| Variable Name | Description |
| ------------- | ----------- |
| PULUMI_DATABASE_USER_NAME | Name of the database user the Pulumi Service connects as. Leave default unless you are having trouble connecting to your database.
| PULUMI_DATABASE_USER_PASSWORD | Password of the database user the Pulumi Service connects as. Leave default unless you are having troubles connecting to your database.
| PULUMI_OBJECTS_BUCKET | S3 bucket name for persisting state for stacks.<br><br>**Note**: Only used if hosted on AWS. |
| RECAPTCHA_SECRET_KEY | reCAPTCHA secret key for self-service password reset. Create a [site key and a secret key from Google](https://www.google.com/recaptcha/admin). |
| SAML_CERTIFICATE_PUBLIC_KEY | Public key used by the [IdP]({{< relref "../saml/sso#terminology" >}}) to sign SAML assertions. Learn how to [set SAML_CERTIFICATE_PUBLIC_KEY]({{< relref "saml-sso" >}}). |
| SAML_CERTIFICATE_PRIVATE_KEY | Private key used by Pulumi to validate the SAML assertions sent by the IdP. Learn how to [set SAML_CERTIFICATE_PRIVATE_KEY]({{< relref "saml-sso" >}}). |
| GITHUB_OAUTH_ENDPOINT | Used for GitHub API calls. |
| GITLAB_OAUTH_ENDPOINT | Used for GitLab API calls. |

### TLS Environment Variables

#### API Service

The service is configurable to serve the API using TLS. The following environment variables are _all_ required in order to enable TLS. The values of the environment variables may either be a filepath or the actual value of the entity. If these variables are set, the service will be served over HTTPS (i.e using TLS) using port `8443`. If the following variables are not set the service will default to serving over HTTP using port `8080`.

| Variable Name       | Description                                                                                               |
|---------------------|-----------------------------------------------------------------------------------------------------------|
| API_TLS_CERTIFICATE | The TLS certificate. The certificate must be supplied in X.509 format and must be PEM encoded.            |
| API_TLS_PRIVATE_KEY | The private key associated with the TLS certificate. The private key must be PEM encoded.                 |
| API_MIN_TLS_VERSION | The minimum version of TLS to use when serving the API (must be in \<major>.\<minor> format, e.g. `1.2`). |

> _Note: Self-signed certificates may be used to configure TLS in the event the need for a trusted entity is not necessary. A self-signed cert and private key may be generated using OpenSSL. The following command uses OpenSSL to generate a self-signed certificate. This example will output two files, the certificate (cert.pem) and the private key (key.pem) used to sign it._

>
```
openssl \
  req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem \
  -days { days_unitl_expiration } -nodes -subj "/CN={ common_name }"
```

#### Database Connections

##### API Service

The service is configurable to enable connections to the backend SQL database over TLS. The following environment variables are _all_ required to connect to the database using TLS. If these variables are set the service will establish connections to the database using TLS, otherwise the service will default to connecting without TLS. The same ports will be used for communication to the database regardless of whether TLS is configured or not.

| Variable Name            | Description                                                                                                   |
|--------------------------|---------------------------------------------------------------------------------------------------------------|
| DATABASE_CA_CERTIFICATE  | The CA certificate used to establish TLS connections with the database. This certificate must be PEM encoded. This must be set to the value of the certificate itself and _not_ a filepath to the location of the certificate file. |
| DATABASE_MIN_TLS_VERSION | The minimum TLS version to use for database connections (must be in \<major>.\<minor> format, e.g. `1.2`).    |

##### Migrations

The database migrations container is configurable to enable connections to the database over TLS. To use TLS, the following environment variable must be set. The default is to not use TLS.

| Variable Name            | Description                                                                                                   |
|--------------------------|---------------------------------------------------------------------------------------------------------------|
| DATABASE_CA_CERTIFICATE  | The CA certificate used to establish TLS connections with the database. This certificate must be PEM encoded. This must be set to the value of the certificate itself and _not_ a filepath to the location of the certificate file. |
| MYSQL_ROOT_USERNAME      | The root username to log in to the MySQL database. Defaults to `root`. |
| MYSQL_ROOT_PASSWORD      | The root user password to log in to the MySQL database. |
| MYSQL_ALLOW_EMPTY_PASSWORD    | Set to `true` to allow the container to be started with a blank password for the root user. |
| PULUMI_DATABASE_ENDPOINT      | The database server endpoint in the format `host:port`. This should be a MySQL 5.6 server. |
| PULUMI_DATABASE_PING_ENDPOINT | The database server endpoint to ping for availability before login. |
| RUN_MIGRATIONS_EXTERNALLY     | Request for migrations to be run against an external database. |
