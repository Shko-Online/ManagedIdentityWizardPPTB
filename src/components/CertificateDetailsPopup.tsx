/*
   Copyright 2026 Shko Online LLC <sales@shko.online>

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

import {
  Button,
  Text,
} from "@fluentui/react-components";
import { Certificate24Regular, Dismiss24Regular } from "@fluentui/react-icons";
import { getCommonName, parseDistinguishedName } from "../utils/distinguishedName";
import { useEffect, useState } from "react";
import type { CertificateChainEntry } from "../types/services/nugetSignatureInspector";
import type { CertificateDetailsPopupProps } from "../types/components/CertificateDetailsPopup";
import useCertificateDetailsStyles from "../styles/CertificateDetailsPopup";

function getCertificateLabel(certificate: CertificateChainEntry): string {
  return getCommonName(certificate.subjectDistinguishedName)
    ?? certificate.subjectDistinguishedName;
}

export function CertificateDetailsPopup({ certificate, onClose }: CertificateDetailsPopupProps) {
  const styles = useCertificateDetailsStyles();
  const [selectedIndex, setSelectedIndex] = useState(certificate.chain.length - 1);
  const selectedCertificate = certificate.chain[selectedIndex];

  useEffect(() => {
    setSelectedIndex(certificate.chain.length - 1);
  }, [certificate]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const fields: Array<[string, string]> = [
    ["Serial number", selectedCertificate.serialNumber],
    ["Valid from", selectedCertificate.validFrom],
    ["Valid to", selectedCertificate.validTo],
    ["SHA-256 fingerprint", selectedCertificate.fingerprint],
  ];
  const issuerAttributes = parseDistinguishedName(selectedCertificate.issuerDistinguishedName);
  const subjectAttributes = parseDistinguishedName(selectedCertificate.subjectDistinguishedName);

  return (
    <div className={styles.overlay} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.popup}
        role="dialog"
        aria-modal="true"
        aria-labelledby="certificate-details-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={styles.header}>
          <Text id="certificate-details-title" weight="semibold" size={400}>Certificate details</Text>
          <Button appearance="subtle" icon={<Dismiss24Regular />} aria-label="Close certificate details" onClick={onClose} />
        </div>
        <div className={styles.body}>
          <div className={styles.chainPanel}>
            <Text className={styles.chainTitle} weight="semibold">Certification path</Text>
            <div role="tree" aria-label="Certification path">
              {certificate.chain.map((chainCertificate, index) => {
                const isSelected = selectedIndex === index;
                const label = getCertificateLabel(chainCertificate);

                return (
                  <button
                    key={`${chainCertificate.serialNumber}-${index}`}
                    className={isSelected ? `${styles.chainItem} ${styles.selectedChainItem}` : styles.chainItem}
                    type="button"
                    role="treeitem"
                    aria-level={index + 1}
                    aria-selected={isSelected}
                    title={chainCertificate.subjectDistinguishedName}
                    style={{ paddingLeft: `${8 + index * 18}px` }}
                    onClick={() => setSelectedIndex(index)}
                  >
                    <Certificate24Regular />
                    <span className={styles.chainLabel}>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          <div className={styles.detailPanel}>
            <Text className={styles.chainTitle} weight="semibold">
              {selectedCertificate.isSigner ? "Signing certificate" : "Certificate"}
            </Text>
            {selectedCertificate.isSigner && <Text className={styles.signerNote}>Used to sign this NuGet package</Text>}
            <table className={styles.fields}>
              <tbody>
                {fields.slice(0, 3).map(([name, value]) => (
                  <tr key={name}>
                    <th className={styles.fieldName} scope="row">{name}</th>
                    <td className={styles.fieldValue} title={value}>{value}</td>
                  </tr>
                ))}
                <tr>
                  <th className={styles.groupName} scope="rowgroup" colSpan={2} title={selectedCertificate.issuerDistinguishedName}>Issuer</th>
                </tr>
                {issuerAttributes.map((attribute, index) => (
                  <tr key={`issuer-${attribute.name}-${index}`}>
                    <th className={styles.attributeName} scope="row">{attribute.name}</th>
                    <td className={styles.fieldValue} title={attribute.value}>{attribute.value}</td>
                  </tr>
                ))}
                <tr>
                  <th className={styles.groupName} scope="rowgroup" colSpan={2} title={selectedCertificate.subjectDistinguishedName}>Subject</th>
                </tr>
                {subjectAttributes.map((attribute, index) => (
                  <tr key={`subject-${attribute.name}-${index}`}>
                    <th className={styles.attributeName} scope="row">{attribute.name}</th>
                    <td className={styles.fieldValue} title={attribute.value}>{attribute.value}</td>
                  </tr>
                ))}
                {fields.slice(3).map(([name, value]) => (
                  <tr key={name}>
                    <th className={styles.fieldName} scope="row">{name}</th>
                    <td className={styles.fieldValue} title={value}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
