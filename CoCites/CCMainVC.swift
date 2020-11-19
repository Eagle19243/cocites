//
//  ViewController.swift
//  CoCites
//
//  Created by nag on 18.11.2020.
//

import Cocoa
import SafariServices

class CCMainVC: NSViewController, NSWindowDelegate {

    override func viewDidLoad() {
        super.viewDidLoad()
        
        self.view.wantsLayer = true
    }
    
    override func viewDidAppear() {
        self.view.window?.delegate = self
        self.view.window?.styleMask = [NSWindow.StyleMask.closable, NSWindow.StyleMask.titled, NSWindow.StyleMask.miniaturizable]
    }
    
    func windowShouldClose(_ sender: NSWindow) -> Bool {
        NSApplication.shared.terminate(self)
        return true
    }
    
    @IBAction func onShowPreferencesClicked(_ sender: Any) {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: BundleIDForExtension) { (error) in
            if let error = error {
                print("Error launching the extension's preferences: %@", error)
            }
        }
    }

}

