import os
import json
import time

class ACPLogger:
    """
    Audit Control Protocol (ACP) Logger
    Tracks configuration changes and versioning for critical cardiac monitoring modules.
    """
    def __init__(self, filename="acp_audit_log.json"):
        self.filename = filename
        if not os.path.exists(self.filename):
            try:
                with open(self.filename, 'w') as f:
                    json.dump([], f)
            except Exception as e:
                print(f"[ERROR] Failed to initialize ACP log file: {e}")

    def log_change(self, component, version, config, description):
        entry = {
            "timestamp": time.strftime('%Y-%m-%dT%H:%M:%S'),
            "component": component,
            "version": version,
            "config": config,
            "description": description
        }
        
        try:
            data = []
            if os.path.exists(self.filename):
                with open(self.filename, 'r') as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError:
                        data = []
            
            data.append(entry)
            
            with open(self.filename, 'w') as f:
                json.dump(data, f, indent=4)
                
            print(f"[ACP] Logged change for {component} (v{version})")
        except Exception as e:
            print(f"[ERROR] Failed to log ACP change: {e}")
