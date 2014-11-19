/**
 * Copyright (c) 2011-2014 by Andrew Mustun. All rights reserved.
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

/**
 * \defgroup ecma_draw_line Shape Drawing Tools
 * \ingroup ecma_draw
 *
 * \brief This module contains ECMAScript implementations of various line drawing tools.
 */
include("../Draw.js");

/**
 * \class Shape
 * \brief Base class for all line drawing tools.
 * \ingroup ecma_draw_line
 */
function Shape(guiAction) {
    Draw.call(this, guiAction);

    this.createPolyline = false;
}

Shape.prototype = new Draw();
Shape.includeBasePath = includeBasePath;

Shape.prototype.beginEvent = function() {
    Draw.prototype.beginEvent.call(this);

    if (!isNull(this.getGuiAction()) && this.getGuiAction().objectName==="ShapeToolsPanelButton") {
        EAction.showCadToolBarPanel("ShapeToolsPanel");
        this.terminate();
    }
};

Shape.getMenu = function() {
    var menu = EAction.getSubMenu(
        Draw.getMenu(),
        20, 800,
        Shape.getTitle(),
        "DrawShapeMenu",
        Shape.includeBasePath + "/Shape.svg"
    );
    menu.setProperty("scriptFile", Shape.includeBasePath + "/Shape.js");
    return menu;
};

Shape.getToolBar = function() {
    var tb = EAction.getToolBar(Shape.getTitle(), "ShapeToolBar");
    tb.visible = false;
    return tb;
};

Shape.getCadToolBarPanel = function() {
    var mtb = Draw.getCadToolBarPanel();
    var actionName = "ShapeToolsPanelButton";
    if (!isNull(mtb) && mtb.findChild(actionName)==undefined) {
        var action = new RGuiAction(qsTr("Shape Tools"), mtb);
        action.setScriptFile(Shape.includeBasePath + "/Shape.js");
        action.objectName = actionName;
        action.setRequiresDocument(true);
        action.setIcon(Shape.includeBasePath + "/Shape.svg");
        action.setStatusTip(qsTr("Show line tools"));
        action.setDefaultShortcut(new QKeySequence("w,l"));
        action.setNoState();
        action.setDefaultCommands(["linemenu"]);
        action.setGroupSortOrder(20);
        action.setSortOrder(800);
        action.setWidgetNames(["MainToolsPanel"]);
    }

    var tb = EAction.getCadToolBarPanel(
        Shape.getTitle(),
        "ShapeToolsPanel",
        true
    );
    return tb;
};

Shape.getTitle = function() {
    return qsTr("&Shape");
};

Shape.prototype.getTitle = function() {
    return Shape.getTitle();
};

Shape.init = function() {
    Shape.getMenu();
    Shape.getToolBar();
    Shape.getCadToolBarPanel();
};

Shape.prototype.initUiOptions = function(resume) {
    Draw.prototype.initUiOptions.call(this, resume);

    this.createPolyline = RSettings.getBoolValue(this.settingsGroup + "/CreatePolyline", false);

    var optionsToolBar = EAction.getOptionsToolBar();
    var w = optionsToolBar.findChild("CreatePolyline");
    if (!isNull(w)) {
        w.checked = this.createPolyline;
    }
};

Shape.prototype.hideUiOptions = function(saveToSettings) {
    Draw.prototype.hideUiOptions.call(this, saveToSettings);

    RSettings.setValue(this.settingsGroup + "/CreatePolyline", this.createPolyline);
};

Shape.prototype.slotCreatePolylineChanged = function(checked) {
    this.createPolyline = checked;
};

Shape.prototype.getShapes = function(vertices) {
    var i;
    if (this.createPolyline) {
        var pl = new RPolyline();
        for (i=0; i<vertices.length; ++i) {
            pl.appendVertex(vertices[i]);
        }
        pl.setClosed(true);
        return [pl];
    }
    else {
        var ret = [];
        for (i=0; i<vertices.length; ++i) {
            ret.push(new RLine(vertices[i], vertices[(i+1)%vertices.length]));
        }
        return ret;
    }
};