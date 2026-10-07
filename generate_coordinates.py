import tkinter as tk
from tkinter import messagebox, ttk
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import numpy as np
import json

class PointSelector:
    def __init__(self, root):
        self.root = root
        self.root.title("Select 8 Points")
        self.points = []
        self.max_points = 8

        self.max_coord = 8.0
        self.min_coord = -8.0
        self.spacing = 0.25

        self.hover_text = None

        # Pack buttons FIRST at the bottom so they're always visible
        btn_frame = tk.Frame(root)
        btn_frame.pack(side='bottom', fill='x', pady=5)
        tk.Button(btn_frame, text="Reset", command=self.reset).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Export JSON", command=self.save_to_json).pack(side=tk.LEFT, padx=5)

        # Status label
        self.label = tk.Label(root, text="Points: 0/8 | Left-click: add | Right-click: delete")
        self.label.pack(side='bottom', fill='x', pady=2)

        # Canvas fills remaining space
        self.fig, self.ax = plt.subplots(figsize=(10, 10))
        self.canvas = FigureCanvasTkAgg(self.fig, master=root)
        self.canvas.get_tk_widget().pack(fill=tk.BOTH, expand=True)
        self.canvas.mpl_connect('button_press_event', self.on_click)

        self.dragging = None  # index of point being dragged

        self.canvas.mpl_connect('button_press_event', self.on_click)
        self.canvas.mpl_connect('motion_notify_event', self.on_motion)
        self.canvas.mpl_connect('button_release_event', self.on_release)


        self.draw_plot()

    def draw_plot(self):
        self.ax.clear()
        self.ax.set_xlim(self.min_coord, self.max_coord)
        self.ax.set_ylim(self.min_coord, self.max_coord)

        # Minor grid: 0.25
        minor_ticks = np.arange(self.min_coord, self.max_coord + 0.25, 0.25)
        self.ax.set_xticks(minor_ticks)
        self.ax.set_yticks(minor_ticks)
        self.ax.minorticks_on()
        self.ax.grid(which='minor', color='lightgray', linestyle='-', linewidth=0.3)

        # Major grid: 0.5
        major_ticks = np.arange(self.min_coord, self.max_coord + 0.5, 0.5)
        self.ax.set_xticks(major_ticks)
        self.ax.set_yticks(major_ticks)
        self.ax.grid(which='major', color='gray', linestyle='-', linewidth=0.7)

        self.ax.set_xlabel("x", fontsize=12)
        self.ax.set_ylabel("y", fontsize=12)
        self.ax.axhline(0, color='black', linewidth=1)
        self.ax.axvline(0, color='black', linewidth=1)

        # Corners
        corners = [(-8, -8), (8, -8), (8, 8), (-8, 8)]
        self.ax.plot([c[0] for c in corners], [c[1] for c in corners],
                     'ks', markersize=8, zorder=5)
        for c in corners:
            self.ax.annotate(f"({c[0]},{c[1]})", c, textcoords="offset points",
                             xytext=(5, 5), fontsize=8, color='black')

        # Points
        for i, pt in enumerate(self.points):
            self.ax.plot(pt['x'], pt['y'], 'ro', markersize=10, zorder=5)
            self.ax.annotate(str(pt['p']), (pt['x'], pt['y']),
                             textcoords="offset points", xytext=(8, 8),
                             fontsize=10, fontweight='bold', color='red')

        self.ax.set_title("Click to select 8 points")
        self.ax.set_aspect('equal')
        self.fig.canvas.draw()

    def on_click(self, event):
        if event.inaxes != self.ax:
            return
        x, y = event.xdata, event.ydata

        # Right-click: delete
        if event.button == 3:
            self.delete_nearest(x, y)
            return

        # Left-click: check if clicking on an existing point (drag)
        if event.button == 1:
            idx = self.find_nearest(x, y, threshold=0.5)
            if idx is not None:
                self.dragging = idx
                return

            # Otherwise: add new point
            if len(self.points) >= self.max_points:
                return
            x = round(x / self.spacing) * self.spacing
            y = round(y / self.spacing) * self.spacing
            x = max(self.min_coord, min(self.max_coord, x))
            y = max(self.min_coord, min(self.max_coord, y))
            self.points.append({"x": x, "y": y, "p": len(self.points) + 1})
            self.draw_plot()
            self.update_label()

    def on_motion(self, event):
        # Drag logic (unchanged)
        if self.dragging is not None:
            if event.inaxes != self.ax:
                return
            x = round(event.xdata / self.spacing) * self.spacing
            y = round(event.ydata / self.spacing) * self.spacing
            x = max(self.min_coord, min(self.max_coord, x))
            y = max(self.min_coord, min(self.max_coord, y))
            self.points[self.dragging]["x"] = x
            self.points[self.dragging]["y"] = y
            self.draw_plot()
            return

        # Hover: show coordinates of nearest point
        if event.inaxes != self.ax:
            self._clear_hover()
            return

        idx = self.find_nearest(event.xdata, event.ydata, threshold=0.5)
        if idx is not None:
            pt = self.points[idx]
            self._clear_hover()
            self.hover_text = self.ax.annotate(
                f"({pt['x']}, {pt['y']})",
                (pt['x'], pt['y']),
                textcoords="offset points", xytext=(15, 15),
                fontsize=9, color='blue',
                bbox=dict(boxstyle="round,pad=0.3", fc="yellow", alpha=0.8)
            )
            self.fig.canvas.draw_idle()
        else:
            self._clear_hover()

    def _clear_hover(self):
        if self.hover_text is not None:
            try:
                self.hover_text.remove()
            except (NotImplementedError, ValueError):
                pass
            self.hover_text = None
            self.fig.canvas.draw_idle()

    def on_release(self, event):
        if self.dragging is not None:
            self.dragging = None
            self.draw_plot()

    
    def find_nearest(self, mx, my, threshold=0.5):
        """Return index of nearest point within threshold, or None."""
        min_dist = float('inf')
        min_idx = None
        for i, pt in enumerate(self.points):
            d = (pt['x'] - mx) ** 2 + (pt['y'] - my) ** 2
            if d < min_dist:
                min_dist = d
                min_idx = i
        if min_dist <= threshold ** 2:
            return min_idx
        return None

    def delete_nearest(self, mx, my):
        idx = self.find_nearest(mx, my, threshold=0.5)
        if idx is not None:
            self.points.pop(idx)
            for i, pt in enumerate(self.points):
                pt['p'] = i + 1
            self.draw_plot()
            self.update_label()

    def update_label(self):
        self.label.config(text=f"Points: {len(self.points)}/{self.max_points} | Left-click: add/drag | Right-click: delete")

    def delete_nearest(self, mx, my):
        if not self.points:
            return
        min_dist = float('inf')
        min_idx = -1
        for i, pt in enumerate(self.points):
            d = (pt['x'] - mx) ** 2 + (pt['y'] - my) ** 2
            if d < min_dist:
                min_dist = d
                min_idx = i
        # Only delete if click is close enough (< 0.5 units)
        if min_dist < 0.5:
            self.points.pop(min_idx)
            # Renumber
            for i, pt in enumerate(self.points):
                pt['p'] = i + 1
            self.draw_plot()
            self.label.config(text=f"Points: {len(self.points)}/{self.max_points} | Left-click: add | Right-click: delete")

    def reset(self):
        self.points.clear()
        self.draw_plot()
        self.label.config(text=f"Points: 0/{self.max_points} | Left-click: add | Right-click: delete")

    def save_to_json(self):
        if not self.points:
            messagebox.showwarning("Warning", "No points selected.")
            return

        dialog = tk.Toplevel(self.root)
        dialog.title("Export Metadata")
        dialog.geometry("350x250")
        dialog.transient(self.root)
        dialog.grab_set()
        dialog.lift()          # ← bring to front
        dialog.focus_force()   # ← force focus

        tk.Label(dialog, text="Drittel:").grid(row=0, column=0, padx=5, pady=5, sticky='w')
        drittel_var = tk.StringVar(value="2. Drittel")
        tk.Entry(dialog, textvariable=drittel_var, width=20).grid(row=0, column=1, padx=5, pady=5)

        tk.Label(dialog, text="Name:").grid(row=1, column=0, padx=5, pady=5, sticky='w')
        name_var = tk.StringVar(value="")
        tk.Entry(dialog, textvariable=name_var, width=30).grid(row=1, column=1, padx=5, pady=5)

        tk.Label(dialog, text="Tanz:").grid(row=2, column=0, padx=5, pady=5, sticky='w')
        tanz_var = tk.StringVar(value="WW")
        tk.Entry(dialog, textvariable=tanz_var, width=10).grid(row=2, column=1, padx=5, pady=5)

        tk.Label(dialog, text="Order:").grid(row=3, column=0, padx=5, pady=5, sticky='w')
        order_var = tk.StringVar(value="0")
        tk.Entry(dialog, textvariable=order_var, width=10).grid(row=3, column=1, padx=5, pady=5)

        def do_save():
            data = {
                "drittel": drittel_var.get(),
                "points": [{"x": pt["x"], "y": pt["y"]*-1, "p": pt["p"]} for pt in self.points],
                "name": name_var.get(),
                "tanz": tanz_var.get(),
                "order": order_var.get()
            }
            line = json.dumps(data+",", ensure_ascii=False, separators=(',', ':'))
            with open("points.json", 'a', encoding='utf-8') as f:
                f.write(line + "\n")
            dialog.destroy()
            messagebox.showinfo("Success", "Appended to points.json")

        tk.Button(dialog, text="Save", command=do_save).grid(row=4, column=0, columnspan=2, pady=10)   
if __name__ == "__main__":
    root = tk.Tk()
    app = PointSelector(root)
    root.mainloop()   