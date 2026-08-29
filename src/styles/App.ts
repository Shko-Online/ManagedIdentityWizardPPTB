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

import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'hidden',
    },
    header: {
        padding: tokens.spacingVerticalL,
        paddingBottom: tokens.spacingVerticalS,
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalXXS,
    },
    headerTitle: {
        display: 'flex',
        alignItems: 'baseline',
        gap: tokens.spacingHorizontalM,
        minWidth: '0',
    },
    titleGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalM,
        flexShrink: 0,
    },
    headerIcon: {
        width: '28px',
        height: '28px',
        flexShrink: 0,
    },
    title: {
        flexShrink: 0,
        whiteSpace: 'nowrap',
    },
    subtitle: {
        color: tokens.colorNeutralForeground3,
        fontSize: tokens.fontSizeBase300,
        display: 'block',
        flex: '1 1 0',
        minWidth: '0',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
    menuRoot: {
        position: 'relative',
        zIndex: 10,
    },
    toolbar: {
        borderBottom: `1px solid ${tokens.colorNeutralStroke1}`,
        padding: tokens.spacingVerticalS,
        paddingLeft: tokens.spacingHorizontalL,
        paddingRight: tokens.spacingHorizontalL,
    },
    toolbarContent: {
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'center',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap',
    },
    toolbarStatus: {
        color: tokens.colorNeutralForeground3,
    },
    confirmOverlay: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.08)',
        zIndex: 1000,
        pointerEvents: 'auto',
    },
    confirmDialog: {
        width: 'min(420px, calc(100vw - 32px))',
        backgroundColor: tokens.colorNeutralBackground1,
        borderRadius: tokens.borderRadiusLarge,
        boxShadow: tokens.shadow64,
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        padding: `${tokens.spacingVerticalL} ${tokens.spacingHorizontalL}`,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    confirmDialogTitle: {
        margin: 0,
        fontSize: tokens.fontSizeBase500,
        fontWeight: tokens.fontWeightSemibold,
    },
    confirmDialogText: {
        margin: 0,
        color: tokens.colorNeutralForeground2,
        lineHeight: tokens.lineHeightBase300,
    },
    confirmActions: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: tokens.spacingHorizontalS,
        marginTop: tokens.spacingVerticalXS,
    },
    content: {
        flex: 1,
        overflow: 'auto',
        padding: tokens.spacingVerticalL,
        display: 'flex',
        flexDirection: 'column',
        gap: tokens.spacingVerticalM,
    },
    statsRow: {
        display: 'flex',
        gap: tokens.spacingHorizontalS,
        flexWrap: 'wrap',
        alignItems: 'center',
    },
    filtersRow: {
        display: 'flex',
        gap: tokens.spacingHorizontalM,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    filterGroup: {
        display: 'flex',
        alignItems: 'center',
        gap: tokens.spacingHorizontalXS,
        flexWrap: 'wrap',
        paddingInline: tokens.spacingHorizontalXS,
    },
    filterLabel: {
        color: tokens.colorNeutralForeground3,
        marginRight: tokens.spacingHorizontalXS,
    },
    searchInput: {
        minWidth: '280px',
        flex: 1,
    },
    loadingState: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '180px',
    },
    errorText: {
        color: tokens.colorPaletteRedForeground1,
    },
    tableWrapper: {
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: 'auto',
        minHeight: '280px',
        maxHeight: 'calc(100vh - 260px)',
        scrollbarWidth: 'thin',
        scrollbarColor: `${tokens.colorNeutralStrokeAccessible} ${tokens.colorTransparentBackground}`,
        '&::-webkit-scrollbar': {
            width: '12px',
            height: '12px',
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: tokens.colorTransparentBackground,
            borderRadius: tokens.borderRadiusXLarge,
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: tokens.colorNeutralStrokeAccessible,
            borderRadius: tokens.borderRadiusXLarge,
            border: `3px solid ${tokens.colorTransparentBackground}`,
        },
        '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: tokens.colorNeutralStrokeAccessiblePressed,
        },
    },
    entitiesTable: {
        minWidth: '980px',
        tableLayout: 'fixed',
    },
    ellipsisCellText: {
        display: 'inline-block',
        width: '100%',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        verticalAlign: 'bottom',
    },
    logicalNameCell: {
        fontFamily: tokens.fontFamilyMonospace,
        color: tokens.colorNeutralForeground2,
    },
    selectedIndicator: {
        display: 'inline-block',
        width: '100%',
        textAlign: 'center',
        color: tokens.colorBrandForeground1,
        fontSize: tokens.fontSizeBase400,
    },
    selectedRow: {
        backgroundColor: tokens.colorSubtleBackgroundHover,
    },
    selectableRow: {
        cursor: 'pointer',
        ':hover': {
            backgroundColor: tokens.colorSubtleBackgroundPressed,
        },
    },
    tagsGroup: {
        display: 'flex',
        gap: tokens.spacingHorizontalXS,
        flexWrap: 'wrap',
    },
    emptyStateText: {
        padding: tokens.spacingVerticalL,
        color: tokens.colorNeutralForeground3,
    },
    tableFooter: {
        position: 'sticky',
        bottom: 0,
        zIndex: 1,
        backgroundColor: tokens.colorNeutralBackground1,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    },
    topRowContainer: {
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: tokens.spacingVerticalL,
        alignItems: 'stretch',
    },
    connectionStatus: {
        minHeight: '0',
        minWidth: '0',
        height: '100%',
    },
    shkoOnlineAd: {
        minHeight: '0',
        minWidth: '0',
        height: '100%',
    },
});

export default useStyles;