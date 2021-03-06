/**
 * Copyright (c) 2011-2015 by Andrew Mustun. All rights reserved.
 * 
 * This file is part of the QCAD project.
 *
 * QCAD is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * QCAD is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with QCAD.
 */

 
include("../File.js");
include("../AutoSave/AutoSave.js");

/**
 * This action handles all user interaction to save the current drawing. If the current
 * drawing has no file name (has never been saved before), action SaveAs is triggered
 * instead.
 */
function Save(guiAction) {
    File.call(this, guiAction);
}

Save.prototype = new File();

Save.prototype.beginEvent = function() {
    File.prototype.beginEvent.call(this);

    var fileName = this.getDocument().getFileName();
    var fileVersion = this.getDocument().getFileVersion();

    // not yet saved or
    // loaded a backup file or
    // save failed:
    // launch save as instead:
    if (fileName === "" || new QFileInfo(fileName).completeBaseName().startsWith("~") ||
        !this.save(fileName, fileVersion, false)) {

        include("scripts/File/SaveAs/SaveAs.js");
        var saveAsAction = new SaveAs();
        this.getDocumentInterface().queueAction(saveAsAction);
        this.terminate();
        return;
    }
    this.terminate();
};

Save.prototype.save = function(fileName, fileVersion, overwriteWarning) {
    if (isNull(overwriteWarning)) {
        overwriteWarning = true;
    }

    var appWin = EAction.getMainWindow();
    var di = EAction.getDocumentInterface();

    fileVersion = isNull(fileVersion) ? "" : fileVersion;

    fileName = di.getCorrectedFileName(fileName, fileVersion);

    var buttons, ret;
    var saveAs = false;

    if (overwriteWarning) {
        if (new QFileInfo(fileName).exists()) {
            buttons = new QMessageBox.StandardButtons(QMessageBox.Yes, QMessageBox.No);
            ret = QMessageBox.warning(
                        appWin,
                        qsTr("Overwrite File?"),
                        qsTr("The file '%1' already exists. Do you wish to overwrite it?").arg(fileName), buttons);
            if (ret!=QMessageBox.Yes) {
                saveAs = true;
            }
        }
    }

    var colorWarning = RSettings.getBoolValue("SaveAs/ColorWarning", true);
    var noFullColor = !File.isRecommendedVersion(fileVersion);

    if (!saveAs && noFullColor) {
        if (colorWarning) {
            // dxflib has no full color support:
            if (!fileVersion.contains("dxflib")) {
                buttons = new QMessageBox.StandardButtons(QMessageBox.Yes, QMessageBox.No);
                ret = QMessageBox.warning(
                            appWin,
                            qsTr("File Format Version Not Recommended"),
                            qsTr("The file format version you are using is not recommended: '%1'.").arg(fileVersion) + "\n"
                            + qsTr("All black entities and layers will be saved as white.") + "\n"
                            + qsTr("All custom colors will be 'rounded' to the nearest fixed color.") + " " + qsTr("Proceed?"), buttons);
                if (ret!=QMessageBox.Yes) {
                    saveAs = true;
                }
            }
        }
    }

    if (saveAs) {
        include("scripts/File/SaveAs/SaveAs.js");
        var saveAsAction = new SaveAs();
        this.getDocumentInterface().queueAction(saveAsAction);
        this.terminate();
        return true;
    }

    appWin.setProgressText(qsTr("Saving..."));

    if (noFullColor) {
        EAction.handleUserWarning(qsTr("Saving to file format version '%1'.").arg(fileVersion));
        EAction.handleUserWarning(qsTr("Black entities and layers are saved as white."));
        EAction.handleUserWarning(qsTr("Custom colors are 'rounded' to the nearest fixed color."));
    }

    var bakFileName = AutoSave.getAutoSaveFileNameCurrent();

    if (!di.exportFile(fileName, fileVersion)) {
        var text = qsTr("File %1 has not been saved.").arg(fileName);
        appWin.handleUserWarning(text, true);
        appWin.setProgressText();
        return false;
    }

    AutoSave.cleanUp(bakFileName);

    // file name might have been changed by filter (extension added):
    fileName = EAction.getDocument().getFileName();
    var mdiChild = EAction.getMdiChild();
    if (!isNull(mdiChild)) {
        mdiChild.setWindowTitle(addDirtyFlag(new QFileInfo(fileName).fileName()));
    }
    RSettings.addRecentFile(fileName);

    appWin.handleUserMessage(qsTr("Saved drawing:") + " " + fileName);
    if (fileVersion.length!==0) {
        appWin.handleUserMessage(qsTr("Format:") + " " + fileVersion);
    }

    var tabBar = appWin.getTabBar();
    var menuBar = appWin.menuBar();
    tabBar.setTabToolTip(tabBar.currentIndex, fileName);

    appWin.setProgressText();

    return true;
};

