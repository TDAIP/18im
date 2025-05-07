-- ModuleScript: VyVeUI (place in ReplicatedStorage)
local VyVeUI = {}
VyVeUI.__index = VyVeUI

-- Utility to create styled UI elements
local function styleFrame(frame)
    frame.BackgroundColor3 = Color3.fromRGB(30, 33, 50)
    frame.BorderSizePixel = 0
end
local function styleButton(button)
    button.BackgroundColor3 = Color3.fromRGB(60, 63, 80)
    button.TextColor3 = Color3.new(1, 1, 1)
    button.Font = Enum.Font.SourceSansSemibold
    button.TextSize = 16
    button.BorderSizePixel = 0
end
local function styleToggle(toggle)
    -- toggle is Frame containing a button
    toggle.BackgroundTransparency = 1
end
local function styleInput(input)
    input.BackgroundColor3 = Color3.fromRGB(60, 63, 80)
    input.TextColor3 = Color3.new(1, 1, 1)
    input.Font = Enum.Font.SourceSans
    input.TextSize = 16
    input.ClearTextOnFocus = false
    input.BorderSizePixel = 0
end

-- Constructor
function VyVeUI.new(title)
    local self = setmetatable({}, VyVeUI)

    -- ScreenGui
    local gui = Instance.new("ScreenGui")
    gui.Name = "VyVeUI"
    gui.ResetOnSpawn = false
    gui.IgnoreGuiInset = true
    gui.Parent = game:GetService("Players").LocalPlayer:WaitForChild("PlayerGui")

    -- UIScale for mobile support
    local scale = Instance.new("UIScale", gui)
    scale.Scale = 1
    self._scale = scale

    -- Main Window
    local window = Instance.new("Frame", gui)
    window.Name = "MainWindow"
    window.AnchorPoint = Vector2.new(0.5, 0.5)
    window.Position = UDim2.new(0.5, 0, 0.5, 0)
    window.Size = UDim2.new(0, 760, 0, 440)
    styleFrame(window)
    self.Window = window

    -- Header
    local header = Instance.new("Frame", window)
    header.Name = "Header"
    header.Size = UDim2.new(1, 0, 0, 50)
    header.BackgroundTransparency = 1
    self.Header = header

    -- Logo
    local logo = Instance.new("ImageLabel", header)
    logo.Name = "Logo"
    logo.Size = UDim2.new(0, 40, 0, 40)
    logo.Position = UDim2.new(0, 10, 0, 5)
    logo.BackgroundTransparency = 1
    logo.Image = "rbxassetid://INSERT_YOUR_LOGO_ASSETID"

    -- Title
    local titleLabel = Instance.new("TextLabel", header)
    titleLabel.Name = "Title"
    titleLabel.Text = title or "VyVe UI"
    titleLabel.Font = Enum.Font.SourceSansSemibold
    titleLabel.TextSize = 20
    titleLabel.TextColor3 = Color3.new(1, 1, 1)
    titleLabel.BackgroundTransparency = 1
    titleLabel.Position = UDim2.new(0, 60, 0, 0)
    titleLabel.Size = UDim2.new(0, 200, 1, 0)

    -- Minimize Button
    local minBtn = Instance.new("TextButton", header)
    minBtn.Name = "Minimize"
    minBtn.Text = "-"
    minBtn.Font = Enum.Font.SourceSansSemibold
    minBtn.TextSize = 24
    minBtn.Size = UDim2.new(0, 30, 0, 30)
    minBtn.Position = UDim2.new(1, -40, 0, 10)
    styleButton(minBtn)
    minBtn.MouseButton1Click:Connect(function()
        window.Visible = not window.Visible
    end)

    -- Sidebar for Tabs
    local sidebar = Instance.new("Frame", window)
    sidebar.Name = "Sidebar"
    sidebar.Size = UDim2.new(0, 200, 1, -50)
    sidebar.Position = UDim2.new(0, 0, 0, 50)
    styleFrame(sidebar)
    self.Sidebar = sidebar

    -- Content area
    local content = Instance.new("Frame", window)
    content.Name = "Content"
    content.Size = UDim2.new(1, -200, 1, -50)
    content.Position = UDim2.new(0, 200, 0, 50)
    styleFrame(content)
    self.Content = content

    self._tabs = {}
    self._activeTab = nil

    return self
end

-- Add a new tab
function VyVeUI:AddTab(name)
    local index = #self._tabs + 1
    local btn = Instance.new("TextButton", self.Sidebar)
    btn.Name = name .. "TabButton"
    btn.Text = name
    btn.Font = Enum.Font.SourceSansSemibold
    btn.TextSize = 18
    btn.Size = UDim2.new(1, 0, 0, 50)
    btn.Position = UDim2.new(0, 0, 0, (index-1) * 60)
    styleButton(btn)

    local page = Instance.new("Frame", self.Content)
    page.Name = name .. "Page"
    page.Size = UDim2.new(1, 0, 1, 0)
    page.BackgroundTransparency = 1
    page.Visible = false

    btn.MouseButton1Click:Connect(function()
        if self._activeTab then
            self._activeTab.Button.BackgroundColor3 = Color3.fromRGB(60,63,80)
            self._activeTab.Page.Visible = false
        end
        btn.BackgroundColor3 = Color3.fromRGB(80,83,100)
        page.Visible = true
        self._activeTab = {Button = btn, Page = page}
    end)

    -- Activate first tab by default
    if index == 1 then btn:MouseButton1Click() end

    table.insert(self._tabs, {Name=name, Button=btn, Page=page})
    return page
end

-- Add a button to a tab page
function VyVeUI:AddButton(page, name, desc, callback)
    local btn = Instance.new("TextButton", page)
    btn.Size = UDim2.new(0, 200, 0, 40)
    btn.Position = UDim2.new(0, 20, 0, 20 + #page:GetChildren()*50)
    btn.Text = name
    styleButton(btn)
    btn.MouseButton1Click:Connect(callback)
    return btn
end

-- Add a toggle
function VyVeUI:AddToggle(page, name, desc, default, callback)
    local frame = Instance.new("Frame", page)
    frame.Size = UDim2.new(0, 300, 0, 40)
    frame.Position = UDim2.new(0, 240, 0, 20 + #page:GetChildren()*50)
    styleToggle(frame)
    local label = Instance.new("TextLabel", frame)
    label.Text = name
    label.Font = Enum.Font.SourceSans
    label.TextSize = 18
    label.TextColor3 = Color3.new(1,1,1)
    label.BackgroundTransparency = 1
    label.Size = UDim2.new(0.6,0,1,0)

    local tog = Instance.new("TextButton", frame)
    tog.Name = "Toggle"
    tog.Size = UDim2.new(0, 40, 0, 20)
    tog.Position = UDim2.new(1, -50, 0.5, -10)
    styleButton(tog)
    local state = default or false
    local function update()
        tog.Text = state and "ON" or "OFF"
        callback(state)
    end
    tog.MouseButton1Click:Connect(function()
        state = not state
        update()
    end)
    update()
    return tog
end

-- Add an input field
function VyVeUI:AddInput(page, name, placeholder, callback)
    local frame = Instance.new("Frame", page)
    frame.Size = UDim2.new(0, 350, 0, 40)
    frame.Position = UDim2.new(0, 20, 0, 20 + #page:GetChildren()*50)
    styleFrame(frame)
    local label = Instance.new("TextLabel", frame)
    label.Text = name
    label.Font = Enum.Font.SourceSans
n    label.TextSize = 18
    label.TextColor3 = Color3.new(1,1,1)
    label.BackgroundTransparency = 1
    label.Position = UDim2.new(0,0,0,0)
    label.Size = UDim2.new(0.3,0,1,0)

    local input = Instance.new("TextBox", frame)
    input.Name = "Input"
    input.Size = UDim2.new(0.6,0,1,0)
    input.Position = UDim2.new(0.35,0,0,0)
    input.PlaceholderText = placeholder or ""
    styleInput(input)
    input.FocusLost:Connect(function(enter)
        if enter and callback then
            callback(input.Text)
        end
    end)
    return input
end

return VyVeUI


-- Example usage (LocalScript in StarterGui)
--[[
local VyVeUI = require(game.ReplicatedStorage:WaitForChild("VyVeUI"))
local ui = VyVeUI.new("VyVe Roblox")

-- Tabs
local tpPage = ui:AddTab("Main Teleport")
local setPage = ui:AddTab("Settings")

-- Main Teleport Controls
ui:AddButton(tpPage, "Teleport", "", function()
    game:GetService("TeleportService"):Teleport(game.PlaceId, game.Players.LocalPlayer)
end)

ui:AddToggle(tpPage, "AutoFarm", "Auto farm toggle", false, function(state)
    if state then
        -- start autofarm logic
        _G.AutoFarm = true
        spawn(function()
            while _G.AutoFarm do
                -- replace with your farming action
                wait(_G.Delay or 1)
            end
        end)
    else
        _G.AutoFarm = false
    end
end)

ui:AddInput(tpPage, "Delays", "Seconds", function(val)
    local num = tonumber(val)
    if num then _G.Delay = num end
end)

-- Settings Controls
ui:AddButton(setPage, "Settings", "Open settings...", function()
    print("Settings clicked")
end)
--]]
