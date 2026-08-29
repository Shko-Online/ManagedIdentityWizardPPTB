> # Copyright Notice
>
> Copyright 2026 Shko Online LLC <sales@shko.online>
> 
> Licensed under the Apache License, Version 2.0 (the "License");
> you may not use this file except in compliance with the License.
> You may obtain a copy of the License at
> 
>     http://www.apache.org/licenses/LICENSE-2.0
> 
> Unless required by applicable law or agreed to in writing, software
> distributed under the License is distributed on an "AS IS" BASIS,
> WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
> See the License for the specific language governing permissions and
> limitations under the License.

# Managed Identity Wizard

A PPTB tool to simplify configuring Dataverse Managed Identity for Plugin Assemblies or Plugin Packages.

![Managed Identity Wizard](docs/01.managed-identity-wizard.png)

## Solution Filter
Hidden in the flyout menu you can find the Solution Filter.

![Solution filter flyout](docs/02.solution-filter-flyout.png)

Clicking that command will open the solution filter popup.
![Solution filter popup](docs/03.solution-filter-popup.png)

Once you have found the solution you want to filter with you can click the `Select {Solution Name}` button which will activate the solution filter.

## Plugin Packages and Assemblies
Clicking `Refresh Packages` shows the list of available Plugin Packages and Plugin Assemblies for the selected solution, or All Solutions.

![Plugin Packages List](docs/04.plugin-packages-list.png)

![Plugin Assemblies List](docs/05.plugin-assemblies-list.png)

For both we have two possible actions:
1. Inspect ![Inspect Plugin Action](docs/06.inspect-plugin-action.png)
2. Export ![Export Plugin Action](docs/07.export-plugin-action.png)

## Inspect local package
If we are developing the plugin and have the plugin `.nupkg` or `.dll` available locally, we can also inspect these artefacts to check the signature. Clicking `Inspect local package` will open a file selection dialog.

![File Inspection Dialog](docs/08.file-inspection-dialog.png)

## Inspection
Selecting a package or plugin assembly will show the Inspection form.

![Inspection Form](docs/09.inspection-form.png)

This includes `Issuer` and `Subject Identifier` fields calculated from the plugin signature. Some details are controlled by *Managed identity subject settings*

if we are interested in the signature and the public certificate of the signer we can click `View certificate details`
![View certificate details button](docs/12.view-certificate-details-button.png)

## Managed Identity subject settings
We can open the `Managed identity settings` by clicking the command on the flyout actions.
![Managed identity settings](docs/10.managed-identity-settings.png) 

it will open the popup with the following configurations:
![Managed identity settings popup](docs/11.managed-identity-settings-popup.png)

## Certificate Details

Certificate details are show. Including the certification path.
![Certificate Details](docs/13.certificate-details.png)

## License

Apache-2.0
