-- Hàm tối giản script
local function optimizeScript(input)
    -- Thay thế Instance.new
    local optimized = input:gsub("local (%w+) = Instance.new%(\"(%w+)\"%)", "New[%1].ins(\"%2\")")
    
    -- Thay thế print("") -> in("")
    optimized = optimized:gsub("print%((.-)%)", "in(%1)")

    -- Thay thế warn("") -> in("", "red")
    optimized = optimized:gsub("warn%((.-)%)", "in(%1, \"red\")")

    return optimized
end

-- Ví dụ mã gốc
local code = [[
    local part = Instance.new("Part")
    local model = Instance.new("Model")
    local sound = Instance.new("Sound")

    print("Hello, World!")
    warn("Warning message!")
]]

-- Tối giản mã
local optimizedCode = optimizeScript(code)

-- Trả về mã tối giản để lưu vào file hoặc gửi qua HTTP
return optimizedCode